import * as React from 'react'
import { useDeviceGroups } from 'hooks/useDeviceGroups'
import { Box, Select, FormControl, FormLabel } from '@material-ui/core'

export function MediaDeviceSelector({
  label,
  group,
  value,
  onChange,
}: {
  label: React.ReactNode
  value: MediaDeviceInfo | undefined
  onChange(value: MediaDeviceInfo | undefined): void
  group: MediaDeviceInfo[]
}) {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Select
        native
        value={value}
        onChange={(e) =>
          onChange(e.target.value as MediaDeviceInfo | undefined)
        }
      >
        {group.map(
          (input) =>
            input.deviceId && (
              <option key={input.deviceId} value={input.deviceId}>
                {input.label}
              </option>
            ),
        )}
      </Select>
    </FormControl>
  )
}

export function MediaDevicePicker() {
  const deviceGroups = useDeviceGroups()
  const [deviceGroup, setDeviceGroup] = React.useState<
    Partial<Record<MediaDeviceInfo['kind'], MediaDeviceInfo>>
  >({})

  return (
    <Box display="flex" flexDirection="column">
      <MediaDeviceSelector
        label="Audio Input"
        group={deviceGroups.audioinput}
        value={deviceGroup.audioinput}
        onChange={(audioinput) =>
          setDeviceGroup((group) => ({ ...group, audioinput }))
        }
      />
      <MediaDeviceSelector
        label="Audio Output"
        group={deviceGroups.audiooutput}
        value={deviceGroup.audiooutput}
        onChange={(audiooutput) =>
          setDeviceGroup((group) => ({ ...group, audiooutput }))
        }
      />
      <MediaDeviceSelector
        label="Video Input"
        group={deviceGroups.videoinput}
        value={deviceGroup.videoinput}
        onChange={(videoinput) =>
          setDeviceGroup((group) => ({ ...group, videoinput }))
        }
      />
    </Box>
  )
}
