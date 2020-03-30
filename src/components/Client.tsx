import * as React from 'react'
import {
  Divider,
  Paper,
  Grid,
  CircularProgress,
  Box,
  TextField,
  Typography,
  IconButton,
  Snackbar,
  Button,
  Drawer,
  AppBar,
  Toolbar,
  Tooltip,
} from '@material-ui/core'
import { Alert } from '@material-ui/lab'
import { useWebRTC } from 'hooks/useWebRTC'
import { useMessages } from 'hooks/useMessages'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { RoomInfo } from './RoomInfo'
import { useUsernames } from 'hooks/useUsernames'
import { Media } from './Media'
import { OnlineWebRTCClient } from 'utils/WebRTCClient'
import {
  ExitToApp,
  Share,
  KeyboardBackspace,
  Menu as MenuIcon,
  Refresh,
} from '@material-ui/icons'
import { useCopyToClipboard } from 'react-use'

export function Client() {
  return <Hall>{(room, exit) => <Chatroom room={room} exitRoom={exit} />}</Hall>
}

function Hall({
  children,
}: {
  children(room: string, exit: () => void): React.ReactElement
}) {
  const [room, setRoom] = React.useState(() => {
    const search = new URLSearchParams(window.location.search)
    return search.get('room') || ''
  })

  React.useEffect(() => {
    window.history.replaceState(
      null,
      '',
      '?' + new URLSearchParams({ room }).toString(),
    )
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

function Chatroom({ room, exitRoom }: { room: string; exitRoom(): void }) {
  const webrtc = useWebRTC(room)

  if (!webrtc.user) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: 32,
          height: 'calc(var(--vh, 1vh) * 100)',
        }}
      >
        <CircularProgress />
        <Typography variant="overline">Opening the door</Typography>
      </div>
    )
  }

  return (
    <OnlineClient webrtc={webrtc as OnlineWebRTCClient} exitRoom={exitRoom} />
  )
}

function OnlineClient({
  webrtc,
  exitRoom,
}: {
  webrtc: OnlineWebRTCClient
  exitRoom(): void
}) {
  const { state } = webrtc
  const { type, typings, speak, messages } = useMessages(webrtc)
  const { names, setName } = useUsernames(webrtc)

  const typingList = Object.keys(typings)
  const typingsDescription = typingList.length
    ? typingList
        .slice(0, 3)
        .map((id) => names[id])
        .join(', ') +
      (typingList.length > 3
        ? ` and ${typingList.length - 3} more users`
        : ``) +
      (typingList.length > 1 ? ' are' : ' is') +
      ' typing...'
    : ''

  const [open, setOpen] = React.useState(false)

  return (
    <Paper style={{ maxWidth: '480px', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(var(--vh, 1vh) * 100)',
        }}
      >
        <AppBar position="static">
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setOpen(true)}
              style={{ marginRight: 16 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6">Whisper</Typography>
            <Box flex="1" />
            {state !== 'open' && (
              <div>
                <Typography color="error">Disconnected</Typography>
                <Tooltip title="Refresh to reconnect">
                  <IconButton
                    size="small"
                    onClick={() => window.location.reload()}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </div>
            )}
          </Toolbar>
          <Drawer open={open} onClose={() => setOpen(false)}>
            <RoomInfo names={names} setName={setName} webrtc={webrtc} />
          </Drawer>
        </AppBar>
        <Media webrtc={webrtc} names={names} />
        <Grid item style={{ flex: 1, overflowY: 'auto' }}>
          <MessageList names={names} messages={messages} />
        </Grid>
        <div>
          <IconButton
            onClick={(e) => {
              e.stopPropagation()
              exitRoom()
            }}
          >
            <KeyboardBackspace />
          </IconButton>
          <ShareLink />
        </div>
        <Divider />
        <Grid item>
          <MessageInput
            typingsDescription={typingsDescription}
            speak={speak}
            type={type}
          />
        </Grid>
      </div>
    </Paper>
  )
}

function ShareLink() {
  const [, copyToClipboard] = useCopyToClipboard()
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <IconButton
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
          copyToClipboard(window.location.href)
        }}
      >
        <Share />
      </IconButton>
      <Snackbar
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={3 * 1000}
      >
        <Alert severity="success">Link copied!</Alert>
      </Snackbar>
    </>
  )
}
