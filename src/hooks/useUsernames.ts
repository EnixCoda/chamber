import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'

export function useUsernames({
  sendTo,
  user,
  users,
  eventHub,
}: OnlineWebRTCClient) {
  const [names, setNames] = React.useState<Record<User['id'], string>>({})
  const name = names[user.id]

  const setName = React.useCallback(
    function setName(name: string, id = user.id) {
      if (id) setNames((names) => ({ ...names, [id]: name }))
    },
    [user.id],
  )

  // prompt for user preferred name
  React.useEffect(() => {
    const preferredName = user.id // prompt(`May I have your name?`, user.id)
    setName(preferredName || user.id)
  }, [setName, user.id])

  React.useEffect(() => {
    function tellName($user: User) {
      sendTo($user, { type: 'name', content: names[user.id] })
    }

    if (name) {
      Object.values(users).forEach((user) => {
        if (user.state === 'open') tellName(user) // non-open users will be told name when open
      })
      return eventHub.addEventListener('state', (user, state) => {
        if (state === 'open') tellName(user)
      })
    }
  }, [eventHub, users, name, sendTo]) // eslint-disable-line

  React.useEffect(() => {
    return eventHub.addEventListener('message', (source, { type, content }) => {
      switch (type) {
        case 'name':
          const id = source.id
          if (id) setNames((names) => ({ ...names, [id]: content }))
          break
      }
    })
  }, [eventHub])

  return { name, names, setName }
}
