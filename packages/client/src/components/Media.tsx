import { Box, Button, IconButton } from '@material-ui/core'
import { ScreenShare, Videocam } from '@material-ui/icons'
import { useMediaConstraints } from 'hooks/useMediaConstraints'
import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'
import { ConstraintsController } from './ConstraintsController'
import { RemoteMedia } from './RemoteMedia'
import { Window } from './Window'

const adjustConstraints = false

type ReactState<T> = {
  value: T
  set: React.Dispatch<React.SetStateAction<T>>
}

function useUserMedia(
  stream: ReactState<MediaStream | null>['value'],
  setStream: ReactState<MediaStream | null>['set'],
) {
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

  return async function toggleStream(
    mode: 'camera' | 'screen' | 'off' | false,
  ) {
    switch (mode) {
      case 'camera': {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        setStream(stream)
        break
      }
      case 'screen': {
        const screenSteam = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        })
        setStream(screenSteam)
        break
      }
      case false:
      case 'off': {
        setStream(null)
        break
      }
    }
  }
}

export function Media({
  webrtc,
  names,
}: {
  webrtc: OnlineWebRTCClient
  names: Record<User['id'], string>
}) {
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  const toggleStream = useUserMedia(stream, setStream)
  const { constraints, setConstraints } = useMediaConstraints(webrtc)

  return (
    <>
      {stream && adjustConstraints && (
        <ConstraintsController
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
          <IconButton onClick={() => toggleStream('camera')}>
            <Videocam />
          </IconButton>
          <IconButton onClick={() => toggleStream('screen')}>
            <ScreenShare />
          </IconButton>
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
