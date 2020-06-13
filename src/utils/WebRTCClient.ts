import { STUN_SERVERS } from 'env'
import { waitForNextEvent } from 'utils'
import { assert } from './assert'
import { EventHub } from './EventHub'
import { Signaling } from './Signaling'
import { Tunnel } from './Tunnel'

export type User = {
  id: string
  state: Tunnel['state']
  offering: boolean
  connection: RTCPeerConnection
  channel?: DataChannel
}

type Message = {
  type: string
  content: any
}

export interface OnlineWebRTCClient extends WebRTCClient {
  user: User
}

export class WebRTCClient {
  private userID: string | null = null
  private onUpdate: () => void
  private room: string

  signaling: Signaling
  users: Record<string, User> = {}
  eventHub = new EventHub<{
    user: [User, 'connect' | 'disconnect']
    message: [User, Message]
    state: [User, RTCDataChannelState]
  }>(['user', 'message', 'state'])

  constructor(
    serverHost: string,
    room: WebRTCClient['room'],
    onUpdate: () => void,
  ) {
    this.room = room
    this.onUpdate = onUpdate
    this.signaling = new Signaling(serverHost)
    this.setupSignaling(this.signaling)
  }

  get user() {
    return this.userID ? this.users[this.userID] : null
  }

  get state() {
    return this.signaling.tunnel.state
  }

  private shouldBePoliteTo(user: User) {
    if (!this.userID) throw new Error(`No user ID`)
    // higher id has higher priority, be polite to it
    // that is, when collision, accept remote
    return user.id > this.userID
  }

  private setupSignaling(signaling: Signaling) {
    // join room when tunnel open
    signaling.tunnel.eventHub.addEventListener('state', (state) => {
      if (state === 'open') {
        signaling.joinRoom(this.room)
      }
      this.onUpdate()
    })

    signaling.eventHub.addEventListener(
      'offer',
      async (source, remoteDescription) => {
        assert(source !== this.userID)
        const { users } = this
        const user = users[source]
        const { connection } = user
        if (connection.signalingState === 'closed') return

        if (connection.signalingState !== 'stable' /* || user.offering */) {
          if (this.shouldBePoliteTo(user)) {
            console.log('[WebRTCClient]', `Take collision offer`)
          } else {
            console.log('[WebRTCClient]', `Ignore collision offer`)
            return
          }
        }
        await connection.setRemoteDescription(remoteDescription)

        await connection.setLocalDescription(await connection.createAnswer())
        const localDescription = connection.localDescription
        if (localDescription === null) throw new Error(`No local description`)
        signaling.answer(source, localDescription)

        this.onUpdate()
      },
    )
    signaling.eventHub.addEventListener('answer', async (source, answer) => {
      assert(source !== this.userID)
      const { users } = this
      const { connection } = users[source]
      await connection.setRemoteDescription(answer)
      this.onUpdate()
    })
    signaling.eventHub.addEventListener('ice', async (source, candidate) => {
      assert(source !== this.userID)
      const { users } = this
      const user = users[source]
      if (!user.connection.remoteDescription) {
        console.warn(
          `[WebRTCClient]`,
          `delaying ice candidate due to no remote description`,
        )
        // wait for remote offer or connection close
        await new Promise((resolve, reject) => {
          const waitForOffer = () => {
            switch (user.connection.signalingState) {
              case 'have-remote-offer': {
                console.log(
                  `[WebRTCClient]`,
                  `adding candidate as remote offer is available`,
                )
                user.connection.removeEventListener(
                  'signalingstatechange',
                  waitForOffer,
                )
                resolve()
                break
              }
              case 'closed': {
                console.log(`[WebRTCClient]`, `stop waiting for remote offer`)
                reject()
                user.connection.removeEventListener(
                  'signalingstatechange',
                  waitForOffer,
                )
                break
              }
            }
          }
          user.connection.addEventListener('signalingstatechange', waitForOffer)
        })
      }
      user.connection.addIceCandidate(candidate)
    })
    signaling.eventHub.addEventListener('sync', ({ id, room }) => {
      // disconnect offline users
      for (const id of Object.keys(this.users)) {
        if (!room.includes(id)) {
          console.log(`[WebRTCClient]`, `disconnecting ${id}`)
          this.disconnect(this.users[id])
        }
      }

      assert(this.userID === null || this.userID === id, {
        msg: `Unexpected ID change`,
      })
      if (!this.userID) console.log(`[WebRTCClient]`, `login as ${id}`)
      this.userID = id

      room.forEach(async (id) => {
        if (this.userID === null) throw new Error(`No user ID`)
        if (!this.users[id]) {
          const user: User = {
            id,
            offering: false,
            state: 'connecting',
            connection: new RTCPeerConnection({
              iceServers: [
                {
                  urls: STUN_SERVERS,
                },
              ],
            }),
          }
          console.log(`[WebRTCClient]`, `adding user ${id}`)

          if (user.id !== this.userID) this.setupUserConnection(user)
          this.users[id] = user
          this.eventHub.emit('user', [user, 'connect'])
          if (this.shouldBePoliteTo(user)) {
            console.log(
              `[WebRTCClient]`,
              `Attaching data channel to ${user.id}`,
            )

            this.attachDataChannel(
              user,
              user.connection.createDataChannel(
                `message-data-channel-${this.userID}-to-${user.id}`,
              ),
            )
          }
        }
      })

      this.onUpdate()
    })
  }

  private setupUserConnection(user: User) {
    const { id, connection } = user
    connection.addEventListener('datachannel', ({ channel }) => {
      if (user.channel) {
        console.warn(
          '[WebRTCClient]',
          `Received data channel while already have one`,
        )
      } else {
        console.log('[WebRTCClient]', `Received data channel`)
      }
      // Callee setup data channel passively
      this.attachDataChannel(user, channel)
      this.onUpdate()
    })
    connection.addEventListener('negotiationneeded', async () => {
      if (connection.signalingState !== 'stable') {
        console.warn(
          '[WebRTCClient]',
          `Another negotiation needed while already negotiating with`,
          id,
        )
        return
      }

      user.offering = true
      try {
        await connection.setLocalDescription(await connection.createOffer())
        if (connection.localDescription === null) {
          throw new Error(`No local description`)
        }
        this.signaling.offer(id, connection.localDescription)
      } finally {
        user.offering = false
      }
    })
    connection.addEventListener('icecandidate', (e) => {
      if (e.candidate) this.signaling.sendICECandidate(id, e.candidate)
    })
    connection.addEventListener('iceconnectionstatechange', () => {
      if (connection.iceConnectionState === 'failed') {
        ;(connection as any).restartIce?.()
      }
    })
    return connection
  }

  private attachDataChannel(user: User, dataChannel: RTCDataChannel) {
    if (user.channel) {
      console.warn('[WebRTCClient]', `Abandoning previous data channel`)
      user.channel.destruct()
    }
    const channel = new DataChannel(dataChannel)
    user.channel = channel

    if (dataChannel.readyState !== 'connecting')
      console.warn(
        `[WebRTCClient]`,
        `data channel is ${dataChannel.readyState} when attaching`,
      )

    channel.addEventListener('message', (event) => {
      console.log(
        '[WebRTCClient]',
        `Message from ${dataChannel.label}`,
        JSON.parse(event.data),
      )
      this.eventHub.emit('message', [user, JSON.parse(event.data)])
    })
    channel.addEventListener('open', () => {
      assert(user.channel?.native === dataChannel, { debug: true })
      this.handleChannelStatusChange(channel.native, user)
    })
    channel.addEventListener('close', () => {
      assert(user.channel?.native === dataChannel, { debug: true })
      this.handleChannelStatusChange(channel.native, user)
    })
    channel.addEventListener('error', (err) => {
      assert(user.channel?.native === dataChannel, { debug: true })
      console.error('[WebRTCClient]', `data channel error`, err)
    })
    this.onUpdate()
  }

  private handleChannelStatusChange(channel: RTCDataChannel, user: User) {
    const state = channel.readyState
    user.state = state
    console.log(
      '[WebRTCClient]',
      `data channel for ${user.id} switched to`,
      state,
    )
    this.eventHub.emit('state', [user, state])
    this.onUpdate()
  }

  private disconnect(user: User) {
    const { channel, connection } = user
    connection.close()

    if (channel) channel.destruct()

    Reflect.deleteProperty(this.users, user.id)

    this.eventHub.emit('user', [user, 'disconnect'])
  }

  sendTo = async (user: User, message: Message) => {
    if (user.id === this.userID) return
    const { channel } = user
    if (!channel) {
      console.warn('[WebRTCClient]', `data channel to`, user.id, `not set yet`)
      return
    }
    switch (channel.native.readyState) {
      case 'closed':
      case 'closing':
        console.error(
          `Trying to send message while channel is ${channel.native.readyState}`,
        )
        return
      case 'connecting': {
        console.warn(
          '[WebRTCClient]',
          `data channel to ` + user.id + ` is not open yet, delayed sending`,
          message,
        )
        await waitForNextEvent(channel, 'open')
        console.warn(
          '[WebRTCClient]',
          `data channel to ` + user.id + ` is open now, sending delayed`,
          message,
        )
      }
    }
    console.log(`[WebRTCClient]`, `sending`, message)
    channel.native.send(JSON.stringify(message))
  }

  broadcast = (message: Message) => {
    Object.values(this.users).forEach((user) => this.sendTo(user, message))
  }

  destruct() {
    this.signaling.destruct()
    Object.values(this.users).forEach(this.disconnect)
  }
}

// TODO: revert to RTCDataChannel
class DataChannel {
  private unsubscriptions: (() => void)[] = []
  native: RTCDataChannel
  removeEventListener: RTCDataChannel['removeEventListener']

  constructor(channel: RTCDataChannel) {
    this.native = channel
    this.removeEventListener = this.native.removeEventListener.bind(this.native)
  }

  destruct() {
    this.unsubscriptions.forEach((unsubscription) => unsubscription())
    this.native.close()
  }

  addEventListener<K extends keyof RTCDataChannelEventMap>(
    type: K,
    listener: (this: RTCDataChannel, ev: RTCDataChannelEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    this.unsubscriptions.push(() =>
      this.native.removeEventListener(type, listener, options),
    )
    return this.native.addEventListener(type, listener, options)
  }
}
