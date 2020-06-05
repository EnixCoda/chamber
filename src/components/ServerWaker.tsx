import { CircularProgress, Typography } from '@material-ui/core'
import { useVH } from 'components/VH'
import * as React from 'react'

const timeout = 10 * 1000

export function ServerWaker({
  serverHost,
  children,
}: React.PropsWithChildren<{
  serverHost: string
}>) {
  const vhStyle = useVH()
  const [awake, setAwake] = React.useState(false)
  const [showHint, setShowHint] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const search = new URLSearchParams({ redirect: window.location.href })
      window.location.href = `https://${serverHost}?${search.toString()}`
    }, timeout)
    let cancelled = false
    const cancel = () => {
      cancelled = true
      clearTimeout(timer)
    }
    ;(async () => {
      const awake = await new Promise<boolean>((resolve) => {
        const connection = new WebSocket(`wss://${serverHost}`)
        connection.addEventListener('open', () => {
          resolve(true)
          connection.close()
        })
        connection.addEventListener('error', () => resolve(false))
      })
      if (awake) {
        if (!cancelled) {
          setAwake(true)
        }
        cancel()
      }
    })()

    return cancel
  }, [timeout, serverHost])

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

  if (awake) return <>{children}</>

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: 32,
        ...vhStyle,
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
