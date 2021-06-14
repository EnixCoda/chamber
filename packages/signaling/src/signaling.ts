import { connection as WSConnection } from 'websocket'

type ID = string
type Connection = {
  send(message: any): void
  onMessage(message: any): void
}
type Client = {
  id: ID
  send: Connection['send']
}

export type Room = Record<Client['id'], Client>

type RTCMessageTypes = 'offer' | 'answer' | 'ice-candidate'
type RTCMessageIn = {
  type: RTCMessageTypes
  target: ID
  content: any
}
type RTCMessageOut = {
  type: RTCMessageTypes
  source: ID
  content: any
}
type MetaMessageOut = {
  type: 'sync'
  content: any
}
type Message = RTCMessageIn | RTCMessageOut | MetaMessageOut

export const rooms: Record<string, Room> = {}

export function sync(room: Room) {
  Object.keys(room).forEach((id) => {
    send(room, id, {
      type: 'sync',
      content: { id, room: Object.keys(room) },
    })
  })
}

function send(room: Room, id: ID, message: Message) {
  console.log(`[Sending] to`, id, message.content)
  room[id].send(message)
}

export function addUser(room: Room, connection: WSConnection) {
  let userID = ''
  do {
    userID = Math.random()
      .toFixed(4)
      .slice(2)
  } while (room[userID])
  room[userID] = {
    id: userID,
    send(message) {
      connection.sendUTF(JSON.stringify(message))
    },
  }
  return userID
}

export function remove(room: Room, userID: string) {
  Reflect.deleteProperty(room, userID)
}

export function handleMessage(room: Room, userID: string, msg: RTCMessageIn) {
  const { content } = msg
  switch (msg.type) {
    // RTCMessageIn
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      send(room, msg.target, { type: msg.type, source: userID, content })
      break
    default: {
      console.warn(`No handler for message`)
      console.log(msg)
    }
  }
}
