import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'

export function useUsernames({
  sendTo,
  user,
  users,
  eventHub: {
    ports: { message: messageHub, state: stateHub },
  },
}: OnlineWebRTCClient) {
  const [names, setNames] = React.useState<Record<User['id'], string>>({})
  const name = names[user.id]

  // prompt for user preferred name
  React.useEffect(() => {
    if (!names[user.id]) {
      const preferredName = user.id // prompt(`May I have your name?`, user.id)
      setName(preferredName || user.id)
    }
  }, [])

  React.useEffect(() => {
    if (name) Object.values(users).forEach(tellName)
  }, [name, users])

  React.useEffect(() => {
    if (user)
      return stateHub.addEventListener((user, state) => {
        if (state === 'open') tellName(user)
      })
  }, [stateHub, user, name])

  React.useEffect(() => {
    return messageHub.addEventListener((source, { type, content }) => {
      switch (type) {
        case 'name':
          const id = source.id
          if (id) setNames((names) => ({ ...names, [id]: content }))
          break
      }
    })
  }, [messageHub])

  function setName(name: string, id = user.id) {
    if (id) setNames((names) => ({ ...names, [id]: name }))
  }

  function tellName($user: User) {
    sendTo($user, { type: 'name', content: names[user.id] })
  }

  return { name, names, setName }
}
