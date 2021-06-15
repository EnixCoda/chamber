import {
  Box,
  Button,
  InputAdornment,
  TextField,
  Typography,
} from '@material-ui/core'
import { DEFAULT_SERVER, SERVER_HOST } from 'env'
import * as React from 'react'
import { isLocalhost } from '../utils/isLocalhost'

export function ServerSetup({
  children,
}: {
  children(serverHost: string): React.ReactNode
}) {
  const [serverInput, setServerInput] = React.useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('server') || ''
  })
  const [server, setServer] = React.useState(
    () => parseInput(serverInput) || '',
  )

  React.useEffect(() => {
    if (serverInput === '') setServerInput(SERVER_HOST)
  }, []) // eslint-disable-line

  React.useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    search.set('server', server)
    window.history.replaceState(null, '', '?' + search.toString())
  }, [server])

  function parseInput(input: string) {
    try {
      if (!input.match(/\.\w/) && !isLocalhost(input)) return false
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
            <InputAdornment position="start">
              {isLocalhost(serverInput) ? 'http' : 'https'}://
            </InputAdornment>
          ),
        }}
        placeholder="signaling-server.com"
        defaultValue={serverInput || SERVER_HOST}
        value={serverInput}
        onChange={(e) => setServerInput(e.target.value)}
        error={!parsedHost}
      />
      <Typography variant="caption">
        Signaling server helps you find peers to communicate with. But chat
        messages and media stream will not be exposed to it.
      </Typography>
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
