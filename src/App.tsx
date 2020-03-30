import * as React from 'react'
import { ThemeProvider, createMuiTheme } from '@material-ui/core'
import { Client } from 'components/Client'
import './styles.css'
import { useVH } from 'hooks/useVH'
import { WakeServer } from 'components/WakeServer'
import { SERVER_HOST } from 'env'

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#009688',
    },
    secondary: {
      main: '#ffc400',
    },
  },
})

export default function App() {
  useVH()

  const [awake, setAwake] = React.useState(false)

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <ThemeProvider theme={theme}>
        {awake ? (
          <Client />
        ) : (
          <WakeServer
            isAwake={() =>
              new Promise<boolean>((resolve) => {
                const connection = new WebSocket(`wss:${SERVER_HOST}`)
                connection.addEventListener('open', () => {
                  resolve(true)
                  connection.close()
                })
                connection.addEventListener('error', () => resolve(false))
              })
            }
            onAwake={() => setAwake(true)}
          />
        )}
      </ThemeProvider>
    </div>
  )
}
