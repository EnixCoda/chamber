import * as React from 'react'
import { OnlineWebRTCClient } from 'utils/WebRTCClient'

export function useMedia(
  { user }: OnlineWebRTCClient,
  deviceGroup?: Partial<Record<MediaDeviceInfo['kind'], MediaDeviceInfo>>,
) {
  const [constraints, setConstraints] = React.useState<MediaStreamConstraints>({
    video: false,
    audio: false,
  })

  // TODO: update stream with constraints
  React.useEffect(() => {}, [user, constraints])

  // update constraints with device group
  React.useEffect(() => {
    if (deviceGroup) {
      const newConstrains: MediaStreamConstraints = {}
      if (deviceGroup.videoinput) {
        newConstrains.video = {
          deviceId: deviceGroup.videoinput.deviceId,
        }
      } else {
        newConstrains.video = true
      }
      if (deviceGroup.audioinput) {
        newConstrains.audio = {
          deviceId: deviceGroup.audioinput.deviceId,
        }
      } else {
        newConstrains.audio = true
      }
      console.log('[useMedia]', `new constrains`, newConstrains)
      setConstraints(newConstrains)
    }
  }, [deviceGroup])

  return {
    constraints,
    setConstraints,
  }
}
