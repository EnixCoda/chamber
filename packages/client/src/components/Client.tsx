import * as React from 'react'
import { Chatroom } from './Chatroom'
import { Hall } from './Hall'

export function Client({ serverHost }: { serverHost: string }) {
  return (
    <Hall>
      {(room, exit) => (
        <Chatroom serverHost={serverHost} room={room} exitRoom={exit} />
      )}
    </Hall>
  )
}
