import { Tunnel } from './Tunnel'
import { EventHub } from './EventHub'

export class Signaling {
  tunnel: Tunnel

  syncHub = new EventHub<[{ id: string; room: string[] }]>()
  offerHub = new EventHub<[string, RTCSessionDescriptionInit]>()
  answerHub = new EventHub<[string, RTCSessionDescriptionInit]>()
  iceHub = new EventHub<[string, RTCIceCandidate | RTCIceCandidateInit]>()

  constructor() {
    this.tunnel = new Tunnel()
    this.tunnel.messageHub.addEventListener((message) => {
      const { type, source, content } = message
      switch (type) {
        case 'sync':
          this.syncHub.emit(content)
          break
        case 'offer':
          this.offerHub.emit(source, content)
          break
        case 'answer':
          this.answerHub.emit(source, content)
          break
        case 'ice-candidate':
          this.iceHub.emit(source, content)
          break
      }
    })
  }

  destruct() {
    this.tunnel.destruct()
  }

  connect() {
    this.tunnel.connect()
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
