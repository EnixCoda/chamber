import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from '@material-ui/core'
import { DEFAULT_SERVER, SERVER_HOST } from 'env'
import * as React from 'react'

export function SetServer({
  children,
}: {
  children(serverHost: string): React.ReactNode
}) {
  const [serverInput, setServerInput] = React.useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('signaling') || SERVER_HOST || ''
  })
  const [server, setServer] = React.useState(
    () => parseInput(serverInput) || '',
  )

  React.useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    search.set('server', server)
    window.history.replaceState(null, '', '?' + search.toString())
  }, [server])

  function parseInput(input: string) {
    try {
      if (!input.match(/\.\w/)) return false
      const url = new URL('https://' + input)
      return url.host + url.pathname
    } catch (err) {
      return false
    }
  }

  if (server) return <>{children(server)}</>

  const parsedHost = parseInput(serverInput)
  return (
    <Box display="grid" gridGap="16px" width="280px">
      <TextField
        label="Signaling Server"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">https://</InputAdornment>
          ),
        }}
        placeholder="signaling-server.com"
        value={serverInput}
        onChange={(e) => setServerInput(e.target.value)}
        error={!parsedHost}
        helperText={`Signaling server help you get contact with peers. But the chat messages and video stream will not be exposed to it.`}
      />
      <Button
        fullWidth
        variant="contained"
        color="primary"
        disabled={!parsedHost}
        onClick={() => {
          if (parsedHost) setServer(parsedHost)
        }}
      >
        Connect
      </Button>
      {DEFAULT_SERVER && (
        <Typography variant="body2">
          You can fork <a href={DEFAULT_SERVER}>this template</a> to get your
          own server.
        </Typography>
      )}
    </Box>
  )
}
