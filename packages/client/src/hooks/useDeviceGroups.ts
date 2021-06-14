import * as React from 'react'

async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices()

  const deviceGroups: Record<MediaDeviceInfo['kind'], MediaDeviceInfo[]> = {
    audioinput: [],
    audiooutput: [],
    videoinput: [],
  }

  devices.forEach((device) => {
    deviceGroups[device.kind].push(device)
  })

  return deviceGroups
}

export function useDeviceGroups() {
  const [deviceGroups, setDeviceGroups] = React.useState<
    Record<MediaDeviceInfo['kind'], MediaDeviceInfo[]>
  >({
    audioinput: [],
    audiooutput: [],
    videoinput: [],
  })

  React.useEffect(() => {
    getDevices().then(setDeviceGroups)
  }, [])

  return deviceGroups
}
