import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@material-ui/core'
import * as React from 'react'
import { getColor } from 'utils'
import { User } from 'utils/WebRTCClient'

export function MessageList({
  messages,
  names,
}: {
  names: Record<User['id'], string>
  messages: {
    source: User
    content: string
  }[]
}) {
  const lastListItemRef = React.useRef<HTMLLIElement>(null)
  const lastMessage = messages[messages.length - 1]
  React.useEffect(() => {
    if (lastListItemRef.current) {
      lastListItemRef.current.scrollIntoView()
    }
  }, [lastMessage])
  return (
    <List style={{ width: '100%' }} dense>
      {messages.map((message, index, messages) => {
        const {
          source: { id },
          content,
        } = message
        const combo = index > 0 && id === messages[index - 1].source.id
        return (
          <ListItem
            ref={index === messages.length - 1 ? lastListItemRef : undefined}
            key={index}
          >
            {!combo && (
              <ListItemIcon>
                <Typography style={{ color: getColor(id) }} variant="body1">
                  {names[id]}
                </Typography>
              </ListItemIcon>
            )}
            <ListItemText inset={combo} primary={content} />
          </ListItem>
        )
      })}
    </List>
  )
}
