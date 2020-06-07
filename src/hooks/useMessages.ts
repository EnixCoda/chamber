import * as React from 'react'
import { OnlineWebRTCClient, User } from 'utils/WebRTCClient'
import { useDataChannel } from './useDataChannel'
import { useRerender } from './useRerender'

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

export function useMessages(webrtc: OnlineWebRTCClient) {
  const { user } = webrtc

  const rerender = useRerender()
  const typingsRef = React.useRef<Record<User['id'], number>>({})
  const typingsChannel = useDataChannel(webrtc, 'typing', (user) => {
    handleOthersType(user)
  })
  const handleSelfType = React.useCallback(
    throttle(() => typingsChannel.broadcast(''), sendTypePeriod),
    [typingsChannel.broadcast],
  )

  function handleOthersType(user: User) {
    clearTypingTimer(user)
    typingsRef.current[user.id] = window.setTimeout(() => {
      onTypingEnd(user)
    }, clearTypeTimeout)
    rerender()
  }

  function onTypingEnd(user: User) {
    clearTypingTimer(user)
    rerender()
  }

  function clearTypingTimer(user: User) {
    const timer = typingsRef.current[user.id]
    if (timer) {
      window.clearTimeout(timer)
      Reflect.deleteProperty(typingsRef.current, user.id)
    }
  }

  const speakChannel = useDataChannel<string>(
    webrtc,
    'speak',
    (user, content) => {
      onSpeak(user, content)
      onTypingEnd(user)
    },
  )
  const [messages, setMessages] = React.useState<
    { source: User; content: string }[]
  >([])
  function speak(content: string) {
    speakChannel.broadcast(content)
    onSpeak(user, content)
  }
  function onSpeak(source: User, content: string) {
    setMessages((messages) => [...messages, { source, content }])
  }

  return {
    typings: Object.keys(typingsRef.current),
    handleType: handleSelfType,
    messages,
    speak,
  }
}
