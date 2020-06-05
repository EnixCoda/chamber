import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'

function throttle<FN extends (...args: any[]) => void>(
  fn: FN,
  period: number,
): (...args: Parameters<FN>) => void {
  let blockUntil: number = Date.now()
  return (...args) => {
    if (Date.now() < blockUntil) return
    fn(...args)
    blockUntil = Date.now() + period
  }
}

const sendTypePeriod = 1 * 1000
const clearTypeTimeout = 2 * 1000

export function useMessages({
  broadcast,
  user,
  eventHub: {
    ports: { message: messageHub },
  },
}: OnlineWebRTCClient) {
  const typings: Record<User['id'], number> = {}
  const type = throttle(function type() {
    broadcast({ type: 'typing', content: '' })
  }, sendTypePeriod)

  function clearTypingTimer(user: User) {
    const timer = typings[user.id]
    if (timer) {
      window.clearTimeout(timer)
    }
  }

  function onTyping(user: User) {
    clearTypingTimer(user)
    typings[user.id] = window.setTimeout(() => {
      onTypingEnd(user)
    }, clearTypeTimeout)
  }

  function onTypingEnd(user: User) {
    clearTypingTimer(user)
    Reflect.deleteProperty(typings, user.id)
  }

  const [messages, setMessages] = React.useState<
    { source: User; content: string }[]
  >([])

  function speak(content: string) {
    broadcast({ type: 'speak', content })
    onSpeak(user, content)
  }

  const onSpeak = (source: User, content: string) =>
    setMessages((messages) => [...messages, { source, content }])

  React.useEffect(() => {
    return messageHub.addEventListener(function handleMessage(
      source,
      { type, content },
    ) {
      switch (type) {
        case 'speak':
          onSpeak(source, content)
          onTypingEnd(source)
          break
        case 'typing':
          onTyping(source)
          break
      }
    })
  }, [])

  return {
    typings,
    type,
    messages,
    speak,
  }
}
