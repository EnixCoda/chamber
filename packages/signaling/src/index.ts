//#!/usr/bin/env node
import { server as WebSocketServer } from 'websocket'
import { webServer } from './webServer'
import { sync, addUser, remove, handleMessage, Room, rooms } from './signaling'

const wsServer = new WebSocketServer({
  httpServer: webServer,
  autoAcceptConnections: false,
})

if (!wsServer) {
  throw new Error('Unable to create WebSocket server!')
}

wsServer.on('connect', function(connect) {
  console.log(`New connection`)
})

wsServer.on('request', function(request) {
  const connection = request.accept()

  let room: Room | undefined
  let userID: string | undefined

  connection.on('message', function(message) {
    try {
      switch (message.type) {
        case 'utf8': {
          console.log('[Received]:', message.utf8Data)
          if (room) {
            handleMessage(room, userID, JSON.parse(message.utf8Data))
          } else {
            const { type, content: roomID } = JSON.parse(message.utf8Data)
            if (type === 'join room' && roomID) {
              if (!rooms[roomID]) {
                rooms[roomID] = {}
              }
              room = rooms[roomID]
              userID = addUser(room, connection)
              sync(room)
            }
          }
          break
        }
        default:
          console.log(`[Received]: Data in ${message.type} format`)
      }
    } catch (err) {
      console.error(`Error on message`, err)
    }
  })

  connection.on('close', function(reason, description) {
    console.log(`Disconnected`, reason, description)
    if (room && userID) {
      remove(room, userID)
      sync(room)
    }
  })

  connection.on('error', function(error) {
    console.error(error)
  })
})
