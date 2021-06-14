import { IconButton } from '@material-ui/core'
import { Mic, MicOff, Visibility, VisibilityOff } from '@material-ui/icons'
import * as React from 'react'
import { useUpdateEffect } from 'react-use'

export function ConstraintsMutator({
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
