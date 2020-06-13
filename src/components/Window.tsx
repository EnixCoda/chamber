import { Block, MicOff } from '@material-ui/icons'
import { DETECT_TRACKS } from 'env'
import * as React from 'react'

export function Window({
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

  React.useEffect(() => {
    if (!DETECT_TRACKS) {
      setAudioOn(true)
      setVideoOn(true)
      return
    }

    function detectTracks() {
      const videoTracks = stream.getVideoTracks()
      const audioTracks = stream.getAudioTracks()
      console.log('[Media]', 'tracks:', videoTracks, audioTracks)
      const audioOn = audioTracks.some((track) => track.enabled)
      const videoOn = videoTracks.some((track) => track.enabled)
      setAudioOn(audioOn)
      setVideoOn(videoOn)
    }
    detectTracks()
    const onAddTrack = ({ track }: MediaStreamTrackEvent): void => {
      if (track.muted) {
        track.addEventListener('unmute', detectTracks)
      } else {
        detectTracks()
      }
    }
    stream.addEventListener('addtrack', onAddTrack)
    stream.addEventListener('removetrack', detectTracks)
    return () => {
      stream.removeEventListener('addtrack', onAddTrack)
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
