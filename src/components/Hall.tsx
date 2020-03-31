import { Box, Button, TextField } from '@material-ui/core'
import { ExitToApp } from '@material-ui/icons'
import * as React from 'react'

export function Hall({
  children,
}: {
  children(room: string, exit: () => void): React.ReactElement
}) {
  const [room, setRoom] = React.useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('room') || ''
  })
  React.useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    search.set('room', room)
    window.history.replaceState(null, '', '?' + search.toString())
  }, [room])
  const [value, setValue] = React.useState(
    room ||
      Math.round(Math.random() * 0xffffff)
        .toString(16)
        .toUpperCase(),
  )
  return room ? (
    children(room, () => setRoom(''))
  ) : (
    <Box display="grid" gridGap="16px">
      <TextField
        label="Room"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        endIcon={<ExitToApp />}
        fullWidth
        variant="contained"
        color="primary"
        disabled={!value}
        onClick={() => setRoom(value)}
      >
        Enter
      </Button>
    </Box>
  )
}
