import { CircularProgress, Typography } from '@material-ui/core'
import { useWebRTC } from 'hooks/useWebRTC'
import * as React from 'react'
import { OnlineWebRTCClient } from 'utils/WebRTCClient'
import { OnlineChatroom } from './OnlineChatroom'

export function Chatroom({
  room,
  exitRoom,
}: {
  room: string
  exitRoom(): void
}) {
  const webrtc = useWebRTC(room)
  if (!webrtc.user) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: 32,
          height: 'calc(var(--vh, 1vh) * 100)',
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
