import * as React from 'react'
import { WebRTCClient } from 'utils/WebRTCClient'

export function useWebRTC(serverHost: string, room: string) {
  const [, setCount] = React.useState(0)

  const [client] = React.useState(
    () =>
      new WebRTCClient(serverHost, room, function inc() {
        setCount((count) => count + 1)
      }),
  )

  React.useEffect(() => () => client.destruct(), [client])

  return client
}
