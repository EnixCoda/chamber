import * as React from 'react'
import { WebRTCClient } from 'utils/WebRTCClient'
import { useRerender } from './useRerender'

export function useWebRTC(serverHost: string, room: string) {
  const rerender = useRerender()
  const [client] = React.useState(
    () => new WebRTCClient(serverHost, room, rerender),
  )

  React.useEffect(() => () => client.destruct(), [client])

  return client
}
