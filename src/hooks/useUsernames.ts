import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'

export function useUsernames({
  sendTo,
  user,
  users,
  messageHub,
  stateHub,
}: OnlineWebRTCClient) {
  const [names, setNames] = React.useState<Record<User['id'], string>>({})
  const name = names[user.id]

  // prompt for user preferred name once connected
  React.useEffect(() => {
    if (!names[user.id]) {
      const preferredName = user.id // prompt(`May I have your name?`, user.id)
      setName(preferredName || user.id)
    }
  }, [user])

  React.useEffect(() => {
    if (name) Object.values(users).forEach(tellName)
  }, [name])

  React.useEffect(() => {
    if (user)
      return stateHub.addEventListener((user, state) => {
        if (state === 'open') tellName(user)
      })
  }, [user, name])

  React.useEffect(() => {
    return messageHub.addEventListener((source, { type, content }) => {
      switch (type) {
        case 'name':
          setName(content, source.id)
          break
      }
    })
  }, [])

  function setName(name: string, id = user.id) {
    if (id) setNames((names) => ({ ...names, [id]: name }))
  }

  function tellName($user: User) {
    if (user) sendTo($user, { type: 'name', content: names[user.id] })
  }

  return { name, names, setName }
}