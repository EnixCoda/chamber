import {
  AppBar,
  Box,
  Button,
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
            <Typography variant="h6">
              Chamber{state !== 'open' && '(Offline)'}
            </Typography>
            <Box flex="1" />
            {state !== 'open' && (
              <Tooltip title="Refresh to reconnect">
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={() => window.location.reload()}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
            <ShareLink />
          </Toolbar>
          <Drawer open={open} onClose={() => setOpen(false)}>
            <Box display="flex" flexDirection="column" height="100%">
              <Box flex="1" overflow="auto">
                <RoomInfo names={names} setName={setName} webrtc={webrtc} />
              </Box>
              <Box padding={2}>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    exitRoom()
                  }}
                  startIcon={<KeyboardBackspace />}
                >
                  Exit room
                </Button>
              </Box>
            </Box>
          </Drawer>
        </AppBar>
        <Media webrtc={webrtc} names={names} />
        <Grid item style={{ flex: 1, overflowY: 'auto' }}>
          <MessageList names={names} messages={messages} />
        </Grid>
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
