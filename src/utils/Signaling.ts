import { EventHub } from './EventHub'
import { Tunnel } from './Tunnel'

export class Signaling {
  tunnel: Tunnel

  eventHub = new EventHub<{
    sync: [{ id: string; room: string[] }]
    offer: [string, RTCSessionDescriptionInit]
    answer: [string, RTCSessionDescriptionInit]
    ice: [string, RTCIceCandidate | RTCIceCandidateInit]
  }>(['answer', 'ice', 'offer', 'sync'])

  constructor(serverHost: string) {
    this.tunnel = new Tunnel(serverHost)
    this.tunnel.eventHub.addEventListener('message', (message) => {
      const { type, source, content } = message
      switch (type) {
        case 'sync':
          this.eventHub.emit('sync', [content])
          break
        case 'offer':
          this.eventHub.emit('offer', [source, content])
          break
        case 'answer':
          this.eventHub.emit('answer', [source, content])
          break
        case 'ice-candidate':
          this.eventHub.emit('ice', [source, content])
          break
        default:
          console.warn('[Signaling]', `Unknown signaling message`, message)
      }
    })
  }

  destruct() {
    this.tunnel.destruct()
  }

  joinRoom(room: string) {
    this.tunnel.send({ type: 'join room', content: room })
  }

  offer(target: string, description: RTCSessionDescriptionInit) {
    this.tunnel.send({ type: 'offer', target, content: description })
  }

  answer(target: string, description: RTCSessionDescriptionInit) {
    this.tunnel.send({ type: 'answer', target, content: description })
  }

  sendICECandidate(
    target: string,
    candidate: RTCIceCandidate | RTCIceCandidateInit,
  ) {
    this.tunnel.send({ type: 'ice-candidate', target, content: candidate })
  }
}
