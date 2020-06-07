import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'

export function useDataChannel<M>(
  webrtc: OnlineWebRTCClient,
  type: string,
  onMessage: (user: User, message: M) => void,
) {
  React.useEffect(() => {
    return webrtc.eventHub.addEventListener('message', (user, message) => {
      if (type === message.type) onMessage(user, message.content)
    })
  }, [webrtc.eventHub, type, onMessage])
  return {
    send(user: User, content: M) {
      webrtc.sendTo(user, { type, content })
    },
    broadcast(content: M) {
      webrtc.broadcast({ type, content })
    },
  }
}
