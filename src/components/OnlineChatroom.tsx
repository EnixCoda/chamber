import {
  AppBar,
  Box,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Paper,
  Toolbar,
  Tooltip,
  Typography,
} from '@material-ui/core'
import {
  KeyboardBackspace,
  Menu as MenuIcon,
  Refresh,
} from '@material-ui/icons'
import { useMessages } from 'hooks/useMessages'
import { useUsernames } from 'hooks/useUsernames'
import * as React from 'react'
import { OnlineWebRTCClient } from 'utils/WebRTCClient'
import { Media } from './Media'
import { MessageInput } from './MessageInput'
import { MessageList } from './MessageList'
import { RoomInfo } from './RoomInfo'
import { ShareLink } from './ShareLink'

export function OnlineChatroom({
  webrtc,
  exitRoom,
}: {
  webrtc: OnlineWebRTCClient
  exitRoom(): void
}) {
  const { state } = webrtc
  const { type, typings, speak, messages } = useMessages(webrtc)
  const { names, setName } = useUsernames(webrtc)

  const typingsDescription = formatTypings(typings, names)

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

function formatTypings(
  typings: Record<string, number>,
  names: Record<string, string>,
) {
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
  return typingsDescription
}
