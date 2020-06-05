import { STUN_SERVERS } from 'env'
import { EventHub } from './EventHub'
import { Signaling } from './Signaling'

export type User = {
  id: string
  state: RTCDataChannelState
  offering: boolean
  connection: RTCPeerConnection
  channel?: RTCDataChannel
}

type Message = {
  type: string
  content: any
}

export type OnlineWebRTCClient = Omit<WebRTCClient, 'user'> & { user: User }

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

    const { signaling } = this
    signaling.tunnel.eventHub.ports.state.addEventListener((state) => {
      if (state === 'open') {
        signaling.joinRoom(this.room)
      }
      this.onUpdate()
    })
    signaling.eventHub.ports.offer.addEventListener(
      async (source, remoteDescription) => {
        const { users } = this
        const user = users[source]
        const { connection } = user
        if (connection.signalingState === 'closed') return

        if (connection.signalingState !== 'stable' || users[source].offering) {
          if (this.shouldBePoliteTo(user)) {
            console.log(`Take collision offer`)
          } else {
            console.log(`Ignore collision offer`)
            return
          }
        }
        await connection.setRemoteDescription(remoteDescription)

        await connection.setLocalDescription()
        const localDescription = connection.localDescription
        if (localDescription === null) throw new Error(`No local description`)
        signaling.answer(source, localDescription)

        onUpdate()
      },
    )
    signaling.eventHub.ports.answer.addEventListener(async (source, answer) => {
      const { users } = this
      const { connection } = users[source]
      await connection.setRemoteDescription(answer)
      onUpdate()
    })
    signaling.eventHub.ports.ice.addEventListener((source, candidate) => {
      const { users } = this
      const user = users[source]
      user.connection.addIceCandidate(candidate)
    })
    signaling.eventHub.ports.sync.addEventListener(({ id, room }) => {
      // disconnect offline users
      Object.keys(this.users).forEach((id) => {
        if (!room.includes(id)) this.disconnect(this.users[id])
      })

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
          this.setupUserConnection(user)
          this.users[id] = user
          this.eventHub.ports.user.emit(user, 'connect')
          if (user.id !== this.userID) {
            this.attachDataChannel(
              user,
              user.connection.createDataChannel(
                `message-data-channel-${user.id}`,
              ),
            )
          }
        }
      })

      onUpdate()
    })
  }

  get user() {
    return this.userID ? this.users[this.userID] : null
  }

  get state() {
    return this.signaling.tunnel.state
  }

  shouldBePoliteTo(user: User) {
    if (!this.userID) throw new Error(`No self ID`)
    // higher id has higher priority, be polite to it
    // that is, when collision, accept remote
    return user.id > this.userID
  }

  setupUserConnection = (user: User) => {
    const { id, connection } = user
    connection.addEventListener('datachannel', ({ channel }) => {
      if (user.channel) {
        console.warn(`Received data channel while already have one`)
        if (this.shouldBePoliteTo(user)) {
          console.log(`Accepted remote data channel`)
        } else {
          return
        }
      }
      // Callee setup data channel passively
      this.attachDataChannel(user, channel)
      this.onUpdate()
    })
    connection.addEventListener('negotiationneeded', async () => {
      if (connection.signalingState !== 'stable') {
        console.warn(
          `Another negotiation needed while already negotiating with`,
          id,
        )
        return
      }

      user.offering = true
      try {
        await connection.setLocalDescription()
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

    connection.oniceconnectionstatechange = () => {
      if (connection.iceConnectionState === 'failed') {
        ;(connection as any).restartIce?.()
      }
    }
    return connection
  }

  attachDataChannel = (user: User, dataChannel: RTCDataChannel) => {
    if (user.channel) {
      console.warn(`Abandoning previous data channel`)
      user.channel.close()
    }
    user.channel = dataChannel
    dataChannel.addEventListener('message', (event) => {
      console.log(`Message from ${dataChannel.label}`, JSON.parse(event.data))
      this.eventHub.ports.message.emit(user, JSON.parse(event.data))
    })
    dataChannel.addEventListener('open', () =>
      this.handleChannelStatusChange(user),
    )
    dataChannel.addEventListener('close', () =>
      this.handleChannelStatusChange(user),
    )
    dataChannel.addEventListener('error', (err) =>
      console.error(`data channel error`, err),
    )
    this.handleChannelStatusChange(user)
  }

  handleChannelStatusChange = (user: User) => {
    const { channel } = user
    if (!channel) return
    user.state = channel.readyState
    console.log(`data channel for ${user.id} switched to`, channel.readyState)
    this.eventHub.ports.state.emit(user, channel.readyState)
    this.onUpdate()
  }

  disconnect = (user: User) => {
    const { channel, connection } = user
    connection.close()

    if (channel) channel.close()

    Reflect.deleteProperty(this.users, user.id)

    this.eventHub.ports.user.emit(user, 'disconnect')
  }

  sendTo = (user: User, message: Message) => {
    if (user.id === this.userID) return
    const { channel } = user
    if (!channel) {
      console.warn(`data channel to`, user.id, `not set yet`)
      return
    }
    if (channel.readyState === 'connecting') {
      console.warn(
        `data channel to ` + user.id + ` is not open yet, delayed sending`,
        message,
      )
      const sendOnOpenAndDeprecate = () => {
        console.warn(
          `data channel to ` + user.id + ` is open, sending`,
          message,
        )
        channel.send(JSON.stringify(message))
        channel.removeEventListener('open', sendOnOpenAndDeprecate)
      }
      channel.addEventListener('open', sendOnOpenAndDeprecate)
      return
    }
    channel.send(JSON.stringify(message))
  }

  broadcast = (message: Message) => {
    Object.values(this.users).forEach((user) => this.sendTo(user, message))
  }

  destruct = () => {
    this.signaling.destruct()
    Object.values(this.users).forEach(this.disconnect)
  }
}
