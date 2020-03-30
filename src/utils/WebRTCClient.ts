import { Signaling } from './Signaling'
import { EventHub } from './EventHub'
import { STUN_SERVERS } from 'env'

export type User = {
  id: string
  state: RTCDataChannelState
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

  signaling = new Signaling()
  users: Record<string, User> = {}
  userHub = new EventHub<[User, 'connect' | 'disconnect']>()
  messageHub = new EventHub<[User, Message]>()
  stateHub = new EventHub<[User, RTCDataChannelState]>()
  negotiatings = new Set<User['id']>()

  constructor(room: WebRTCClient['room'], onUpdate: () => void) {
    this.room = room
    this.onUpdate = onUpdate

    const { signaling } = this
    signaling.tunnel.stateHub.addEventListener((state) => {
      if (state === 'open') {
        signaling.joinRoom(this.room)
      }
      this.onUpdate()
    })
    signaling.offerHub.addEventListener(async (source, remoteDescription) => {
      this.negotiatings.add(source)
      const { users } = this
      const { connection } = users[source]
      await connection.setRemoteDescription(remoteDescription)
      const answer = await connection.createAnswer()
      await connection.setLocalDescription(answer)
      const localDescription = connection.localDescription
      if (localDescription === null) throw new Error(`No local description`)
      signaling.answer(source, localDescription)
      this.negotiatings.delete(source)
      onUpdate()
    })
    signaling.answerHub.addEventListener(async (source, answer) => {
      console.log(`on answer`)
      const { users } = this
      const { connection } = users[source]
      await connection.setRemoteDescription(answer)
      this.negotiatings.delete(source)
      onUpdate()
    })
    signaling.iceHub.addEventListener((source, candidate) => {
      const { users } = this
      const { connection } = users[source]
      connection.addIceCandidate(candidate)
    })
    signaling.syncHub.addEventListener(({ id, room }) => {
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
            state: 'connecting',
            connection: this.createConnection(id),
          }
          this.users[id] = user
          if (id > this.userID) this.onCallOut(this.users[id])
          this.userHub.emit(user, 'connect')
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

  onCallOut = async (user: User) => {
    const { connection } = user
    this.attachDataChannel(user, connection.createDataChannel('messages'))
    this.onUpdate()
  }

  createConnection = (id: User['id']) => {
    const user = this.users[id]
    if (user && user.connection) {
      console.warn(`prevented overwriting connection`, id)
      return user.connection
    }
    const connection = new RTCPeerConnection({
      iceServers: [
        {
          urls: STUN_SERVERS,
        },
      ],
    })
    connection.addEventListener('datachannel', ({ channel }) => {
      const user = this.users[id]
      if (user.channel) {
        console.warn(`already has channel`, channel === user.channel)
      }
      // Callee setup data channel passively
      this.attachDataChannel(user, channel)
      this.onUpdate()
    })
    connection.addEventListener('negotiationneeded', async () => {
      console.log(`on negotiation needed`)
      if (this.negotiatings.has(id)) {
        console.warn(`Already negeotiating with`, id)
        return
      }
      this.negotiatings.add(id)
      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)
      if (connection.localDescription === null) {
        throw new Error(`No local description`)
      }
      this.signaling.offer(id, connection.localDescription)
    })
    connection.addEventListener('icecandidate', (e) => {
      if (e.candidate === null) return
      this.signaling.sendICECandidate(id, e.candidate)
    })
    return connection
  }

  attachDataChannel = (user: User, dataChannel: RTCDataChannel) => {
    if (user.channel) {
      console.warn(`attaching channel while user already has one`)
    }
    user.channel = dataChannel
    dataChannel.addEventListener('message', (event) => {
      this.messageHub.emit(user, JSON.parse(event.data))
    })
    dataChannel.addEventListener('open', () =>
      this.handleChannelStatusChange(user),
    )
    dataChannel.addEventListener('close', () =>
      this.handleChannelStatusChange(user),
    )
    this.handleChannelStatusChange(user)
  }

  handleChannelStatusChange = (user: User) => {
    const { channel } = user
    if (!channel) return
    user.state = channel.readyState
    this.stateHub.emit(user, channel.readyState)
    this.onUpdate()
  }

  disconnect = (user: User) => {
    const { channel, connection } = user
    connection.close()

    if (channel) channel.close()

    Reflect.deleteProperty(this.users, user.id)

    this.userHub.emit(user, 'disconnect')
  }

  sendTo = (user: User, message: Message) => {
    if (user.id === this.userID) return
    const { channel } = user
    if (!channel || channel.readyState !== 'open') {
      console.warn(`data channel to`, user.id, `closed, cannot send`, message)
      return
    }
    channel.send(JSON.stringify(message))
  }

  broadcast = (message: Message) => {
    Object.values(this.users).forEach((user) => this.sendTo(user, message))
  }

  connect = () => {
    this.signaling.connect()
  }

  destruct = () => {
    this.signaling.destruct()
    Object.values(this.users).forEach(this.disconnect)
  }
}
