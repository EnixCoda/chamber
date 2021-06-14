import { Box, Button } from '@material-ui/core'
import { Videocam } from '@material-ui/icons'
import { useMedia } from 'hooks/useMedia'
import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'
import { ConstraintsMutator } from './ConstraintsMutator'
import { RemoteMedia } from './RemoteMedia'
import { Window } from './Window'

const adjustConstraints = false

function useUserMedia() {
  const [stream, setStream] = React.useState<MediaStream | null>(null)

  React.useEffect(() => {
    if (stream) {
      return () =>
        stream.getTracks().forEach((track) => {
          console.log(`[Media]`, `Stopping track`, track.id)
          track.stop()
          stream.removeTrack(track)
        })
    }
  }, [stream])

  return {
    stream,
    async toggleStream(open: boolean) {
      if (open) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        setStream(stream)
      } else {
        setStream(null)
      }
    },
  }
}

export function Media({
  webrtc,
  names,
}: {
  webrtc: OnlineWebRTCClient
  names: Record<User['id'], string>
}) {
  const { stream, toggleStream } = useUserMedia()
  const { constraints, setConstraints } = useMedia(webrtc)

  return (
    <>
      {stream && adjustConstraints && (
        <ConstraintsMutator
          constraints={constraints}
          setConstraints={setConstraints}
        />
      )}
      {stream ? (
        <div>
          <Button onClick={() => toggleStream(false)}>Stop Sharing</Button>
        </div>
      ) : (
        <div>
          <Button onClick={() => toggleStream(true)}>
            <Videocam /> Share video
          </Button>
        </div>
      )}
      <Box display="flex" flexWrap="wrap" width="100%" overflow="auto">
        {stream && (
          <Window name={names[webrtc.user.id]} stream={stream} muted />
        )}

        {Object.values(webrtc.users).map(
          (user) =>
            user !== webrtc.user && (
              <RemoteMedia
                key={user.id}
                user={user}
                name={names[user.id]}
                localStream={stream}
              />
            ),
        )}
      </Box>
    </>
  )
}
