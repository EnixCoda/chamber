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
    this.tunnel.eventHub.ports.message.addEventListener((message) => {
      const { type, source, content } = message
      switch (type) {
        case 'sync':
          this.eventHub.ports.sync.emit(content)
          break
        case 'offer':
          this.eventHub.ports.offer.emit(source, content)
          break
        case 'answer':
          this.eventHub.ports.answer.emit(source, content)
          break
        case 'ice-candidate':
          this.eventHub.ports.ice.emit(source, content)
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
