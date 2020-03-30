import * as React from 'react'
import { Chatroom } from './Chatroom'
import { Hall } from './Hall'

export function Client() {
  return <Hall>{(room, exit) => <Chatroom room={room} exitRoom={exit} />}</Hall>
}
