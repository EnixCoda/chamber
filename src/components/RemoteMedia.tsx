import * as React from 'react'
import { User } from 'utils/WebRTCClient'
import { Window } from './Window'

export function RemoteMedia({
  user,
  localStream,
  name,
  muted,
}: {
  user: User
  localStream: MediaStream | null
  name: string
  muted?: boolean
}) {
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const [senders, setSenders] = React.useState<RTCRtpSender[] | null>(null)

  // feed local stream to users
  React.useEffect(() => {
    if (localStream) {
      const tracks = localStream.getTracks()
      const senders = tracks.map((track) => {
        console.log('[RemoteMedia]', `feeding track to`, user.id, track.id)
        return user.connection.addTrack(track, localStream)
      })
      setSenders(senders)
    } else {
      setSenders(null)
    }
  }, [localStream, user])

  React.useEffect(() => {
    if (!senders) return
    return () => {
      if (user.connection.connectionState === 'connected') {
        for (const sender of senders) {
          user.connection.removeTrack(sender)
        }
      }
    }
  }, [user, senders])

  // listen to current and future users
  React.useEffect(() => {
    return user.connection.addEventListener('track', ({ track, streams }) => {
      console.log('[RemoteMedia]', `got track from ${user.id}`, track.id)
      if (streams.length !== 1) {
        console.warn(`Stream amount is not exactly 1`)
      }
      const [stream] = streams
      setStream(stream)
    })
  }, [user])

  React.useEffect(() => {
    if (stream) {
      return stream.addEventListener('removetrack', ({ track }) => {
        console.log('[RemoteMedia]', `Track removed`, track.id)
        if (stream.getTracks().filter((track) => !track.muted).length === 0) {
          setStream(null)
        }
      })
    }
  }, [user, stream])

  return stream && <Window name={name} stream={stream} muted={muted} />
}
