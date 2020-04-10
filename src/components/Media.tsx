import { Box, Button, IconButton } from '@material-ui/core'
import {
  Block,
  Mic,
  MicOff,
  Videocam,
  Visibility,
  VisibilityOff,
} from '@material-ui/icons'
import { DETECT_TRACKS } from 'env'
import { useMedia } from 'hooks/useMedia'
import * as React from 'react'
import { useUpdateEffect } from 'react-use'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'

export function Media({
  webrtc,
  names,
}: {
  webrtc: OnlineWebRTCClient
  names: Record<User['id'], string>
}) {
  const { streams, setMedia, constraints, setConstraints } = useMedia(webrtc)

  const user = webrtc.user
  const stream = streams[user.id]
  return (
    <>
      {stream ? (
        <ConstraintsMutator
          constraints={constraints}
          setConstraints={setConstraints}
        />
      ) : (
        <div>
          <Button onClick={() => setMedia({ video: true, audio: true })}>
            <Videocam /> Share video
          </Button>
        </div>
      )}
      <Box display="flex" flexWrap="wrap" width="100%" overflow="auto">
        {Object.keys(streams).map((id) => (
          <Window
            key={id}
            name={names[id]}
            stream={streams[id]}
            muted={user.id === id}
          />
        ))}
      </Box>
    </>
  )
}

function ConstraintsMutator({
  constraints,
  setConstraints,
}: {
  constraints: MediaStreamConstraints
  setConstraints(constraints: MediaStreamConstraints): void
}) {
  const [videoOn, setVideoOn] = React.useState(Boolean(constraints.video))
  const [audioOn, setAudioOn] = React.useState(Boolean(constraints.audio))

  useUpdateEffect(() => {
    if (
      videoOn === Boolean(constraints.video) &&
      audioOn === Boolean(constraints.audio)
    )
      return
    setConstraints({
      video: videoOn,
      audio: audioOn,
    })
  }, [videoOn, audioOn])

  return (
    <div>
      <IconButton onClick={() => setVideoOn((on) => !on)}>
        {videoOn ? <Visibility /> : <VisibilityOff />}
      </IconButton>
      <IconButton onClick={() => setAudioOn((on) => !on)}>
        {audioOn ? <Mic /> : <MicOff />}
      </IconButton>
    </div>
  )
}

function Window({
  name,
  stream,
  muted,
}: {
  stream: MediaStream
  name?: string
  muted?: boolean
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  React.useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  const [audioOn, setAudioOn] = React.useState(false)
  const [videoOn, setVideoOn] = React.useState(false)

  function detectTracks() {
    const videoTracks = stream.getVideoTracks()
    const audioTracks = stream.getAudioTracks()
    console.log('tracks:', videoTracks, audioTracks)
    const audioOn = audioTracks.some((track) => track.enabled)
    const videoOn = videoTracks.some((track) => track.enabled)
    setAudioOn(audioOn)
    setVideoOn(videoOn)
  }

  React.useEffect(() => {
    if (!DETECT_TRACKS) {
      setAudioOn(true)
      setVideoOn(true)
      return
    }
    detectTracks()
    stream.addEventListener('addtrack', detectTracks)
    stream.addEventListener('removetrack', detectTracks)
    return () => {
      stream.removeEventListener('addtrack', detectTracks)
      stream.removeEventListener('removetrack', detectTracks)
    }
  }, [stream])

  return (
    <div style={{ position: 'relative', width: 160, height: 90 }}>
      <span
        style={{
          position: 'absolute',
          color: 'white',
          textShadow:
            '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
        }}
      >
        {name}
      </span>
      {(!audioOn || !videoOn) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            width: '100%',
            height: '100%',
            color: '#fff',
            fontFamily: 'sans-serif',
          }}
        >
          {audioOn ? (
            <>
              <span>SOUND</span>
              <span>ONLY</span>
            </>
          ) : videoOn ? (
            <MicOff />
          ) : (
            <Block />
          )}
        </div>
      )}
      <video
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
        }}
        playsInline
        autoPlay
        muted={muted}
        ref={videoRef}
      />
    </div>
  )
}
