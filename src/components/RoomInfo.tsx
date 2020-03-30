import * as React from 'react'
import {
  TextField,
  List,
  ListItem,
  Typography,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  ExpansionPanel,
  ExpansionPanelSummary,
  ExpansionPanelDetails,
} from '@material-ui/core'
import { Wifi, WifiOff, Edit, ExpandMore, Check } from '@material-ui/icons'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'
import { getColor } from 'utils'

export function RoomInfo({
  webrtc,
  names,
  setName,
}: {
  webrtc: OnlineWebRTCClient
  names: Record<User['id'], string>
  setName(name: string): void
}) {
  const { user, users, state } = webrtc
  function submitName() {
    if (localName) setName(localName)
    setEditingName(false)
  }
  const peers = user
    ? Object.values(users).filter(({ id }) => id !== user.id)
    : []

  const [localName, setLocalName] = React.useState((user && user.id) || '')
  const [editingName, setEditingName] = React.useState(false)

  const name = user && names[user.id]
  React.useEffect(() => {
    if (name !== localName) setLocalName(name)
  }, [name])

  React.useEffect(() => {
    if (state === 'closed') setEditingName(false)
  }, [state])

  if (!user) return null

  return (
    <ExpansionPanel>
      <ExpansionPanelSummary expandIcon={<ExpandMore />}>
        <Typography>{`${peers.length + 1} people in the room`}</Typography>
      </ExpansionPanelSummary>
      <ExpansionPanelDetails>
        <List
          dense
          style={{
            width: '100%',
            maxHeight: '50vh',
            overflowY: 'auto',
          }}
        >
          <ListItem key={user.id}>
            <ListItemIcon>
              <Wifi color="action" />
            </ListItemIcon>
            {editingName ? (
              <>
                <ListItemText
                  primary={
                    <TextField
                      label="Your name"
                      value={localName}
                      onChange={(e) => {
                        setLocalName(e.target.value)
                      }}
                      onKeyDown={(e) => {
                        if (e.keyCode === 13) {
                          submitName()
                        }
                      }}
                    />
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    onClick={() => submitName()}
                    size="small"
                    edge="end"
                  >
                    <Check />
                  </IconButton>
                </ListItemSecondaryAction>
              </>
            ) : (
              <>
                <ListItemText
                  primary={
                    <Typography
                      style={{ color: getColor(user.id) }}
                      variant="body1"
                    >
                      {names[user.id]}
                      <Typography variant="caption"> (You)</Typography>
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    disabled={state !== 'open'}
                    onClick={() => setEditingName(true)}
                    size="small"
                    edge="end"
                  >
                    <Edit />
                  </IconButton>
                </ListItemSecondaryAction>
              </>
            )}
          </ListItem>
          {peers.map((peer) => (
            <ListItem key={peer.id}>
              <ListItemIcon>
                {peer.state === 'open' ? (
                  <Wifi color="action" />
                ) : (
                  <WifiOff color="action" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <>
                    <Typography
                      style={{ color: getColor(peer.id) }}
                      variant="body1"
                    >
                      {names[peer.id]}
                      <Typography variant="caption"> ({peer.id})</Typography>
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </ExpansionPanelDetails>
    </ExpansionPanel>
  )
}
