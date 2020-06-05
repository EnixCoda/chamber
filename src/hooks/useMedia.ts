import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'

export function useMedia(
  {
    user,
    users,
    eventHub: {
      ports: { user: userHub },
    },
  }: OnlineWebRTCClient,
  deviceGroup?: Partial<Record<MediaDeviceInfo['kind'], MediaDeviceInfo>>,
) {
  const [constraints, setConstraints] = React.useState<MediaStreamConstraints>({
    video: false,
    audio: false,
  })
  const [streams, setStreams] = React.useState<Record<User['id'], MediaStream>>(
    {},
  )
  const stream: MediaStream | undefined = streams[user.id]

  // update stream with constraints
  React.useEffect(() => {
    if (constraints.audio || constraints.video) {
      let cancel = false
      ;(async () => {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (cancel) return
        addStream(user, stream)
      })()

      return () => {
        cancel = true
        removeStream(user)
      }
    }
  }, [user, constraints])

  React.useEffect(() => {
    if (!stream) return
    return () => stream.getTracks().forEach((track) => track.stop())
  }, [stream])

  // feed local stream to users
  React.useEffect(() => {
    if (!stream) return

    function feedStream(user: User, stream: MediaStream) {
      const connection = user.connection
      if (!connection) {
        console.log(`cannot feed`, user.id, connection, stream)
        return
      }
      const $tracks = stream.getTracks()
      $tracks.forEach((track) => connection.addTrack(track, stream))
      console.log(`feeding ${$tracks.length} tracks to`, user.id)
    }

    Object.values(users)
      .filter(($user) => $user.id !== user.id)
      .forEach(($user) => feedStream($user, stream))
    return userHub.addEventListener((user, type) => {
      switch (type) {
        case 'connect': {
          feedStream(user, stream)
          break
        }
      }
    })
  }, [stream])

  function addStream(user: User, stream: MediaStream) {
    setStreams((streams) => ({
      ...streams,
      [user.id]: stream,
    }))
  }

  function removeStream(user: User) {
    setStreams(({ [user.id]: _, ...streams }) => streams)
  }

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
      console.log(`new constains`, newConstrains)
      setConstraints(newConstrains)
    }
  }, [deviceGroup])

  // listen to current and future users
  React.useEffect(() => {
    function listenToTracks(user: User) {
      user.connection.addEventListener('track', ({ track }) => {
        console.log(`got track from ${user.id}`, track.label || track.id)
        setStreams((streams) => {
          const { [user.id]: stream = new MediaStream() } = streams
          stream.addTrack(track)
          track.addEventListener('ended', () => stream.removeTrack(track))

          return stream === streams[user.id]
            ? streams
            : {
                ...streams,
                [user.id]: stream,
              }
        })
      })
    }
    Object.values(users)
      .filter(($user) => $user.id !== user.id)
      .forEach((user) => listenToTracks(user))

    return userHub.addEventListener((user, type) => {
      switch (type) {
        case 'connect': {
          listenToTracks(user)
          break
        }
        case 'disconnect': {
          removeStream(user)
        }
      }
    })
  }, [])

  return {
    streams,
    setMedia(constraints: { video?: boolean; audio?: boolean }) {
      setConstraints(constraints)
    },
    constraints,
    setConstraints,
  }
}
