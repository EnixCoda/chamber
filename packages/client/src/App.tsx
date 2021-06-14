import { createMuiTheme, ThemeProvider } from '@material-ui/core'
import { Client } from 'components/Client'
import { ServerSetup } from 'components/ServerSetup'
import { ServerWaker } from 'components/ServerWaker'
import { VH } from 'components/VH'
import * as React from 'react'
import './styles.css'

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
  return (
    <VH>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ThemeProvider theme={theme}>
          <ServerSetup>
            {(serverHost) => (
              <ServerWaker serverHost={serverHost}>
                <Client serverHost={serverHost} />
              </ServerWaker>
            )}
          </ServerSetup>
        </ThemeProvider>
      </div>
    </VH>
  )
}
