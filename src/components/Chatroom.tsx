import { CircularProgress, Typography } from '@material-ui/core'
import { useVH } from 'components/VH'
import { useWebRTC } from 'hooks/useWebRTC'
import * as React from 'react'
import { OnlineWebRTCClient } from 'utils/WebRTCClient'
import { OnlineChatroom } from './OnlineChatroom'

export function Chatroom({
  room,
  exitRoom,
  serverHost,
}: {
  room: string
  exitRoom(): void
  serverHost: string
}) {
  const webrtc = useWebRTC(serverHost, room)
  const vhStyle = useVH()
  if (!webrtc.user) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: 32,
          ...vhStyle,
        }}
      >
        <CircularProgress />
        <Typography variant="overline">Opening the door</Typography>
      </div>
    )
  }
  return (
    <OnlineChatroom webrtc={webrtc as OnlineWebRTCClient} exitRoom={exitRoom} />
  )
}
