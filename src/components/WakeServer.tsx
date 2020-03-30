import * as React from 'react'
import { Typography, CircularProgress } from '@material-ui/core'
import { SERVER_HOST } from 'env'

export function WakeServer({
  timeout = 10 * 1000,
  isAwake,
  onAwake,
}: {
  isAwake(): Promise<boolean>
  onAwake(): void
  timeout?: number
}) {
  const [showHint, setShowHint] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const search = new URLSearchParams()
      search.append('from', window.location.href)
      window.location.href = SERVER_HOST + `?` + search.toString()
    }, timeout)
    let cancelled = false
    const deffect = () => {
      cancelled = true
      clearTimeout(timer)
    }
    ;(async () => {
      const awake = await isAwake()
      if (awake) {
        if (!cancelled) onAwake()
        deffect()
      }
    })()

    return deffect
  }, [timeout, isAwake, onAwake])

  // count down
  const [second, setSecond] = React.useState(10)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSecond((second) => {
        if (second <= 0) {
          deffect()
          return 0
        }
        return second - 1
      })
    }, 1 * 1000)
    const deffect = () => clearInterval(timer)
    return deffect
  }, [])

  // show hint when half of timeout past
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(true)
    }, timeout / 2)

    return () => clearTimeout(timer)
  }, [timeout])

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
      {showHint ? (
        <Typography variant="overline">
          Taking too long? Redirecting to wake server up in {second} seconds.
        </Typography>
      ) : null}
    </div>
  )
}
