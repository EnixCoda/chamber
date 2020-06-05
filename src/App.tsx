import { createMuiTheme, ThemeProvider } from '@material-ui/core'
import { Client } from 'components/Client'
import { SetServer } from 'components/SetServer'
import { VH } from 'components/VH'
import { WakeServer } from 'components/WakeServer'
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
          <SetServer>
            {(serverHost) => (
              <WakeServer serverHost={serverHost}>
                <Client serverHost={serverHost} />
              </WakeServer>
            )}
          </SetServer>
        </ThemeProvider>
      </div>
    </VH>
  )
}
