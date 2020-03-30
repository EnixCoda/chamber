import * as React from 'react'
import { TextField, Button, Grid, Tooltip } from '@material-ui/core'
import { Send } from '@material-ui/icons'

export function MessageInput({
  speak,
  type,
  typingsDescription,
}: {
  speak(content: string): void
  type(): void
  typingsDescription?: string
}) {
  const [value, setValue] = React.useState<string>('')
  React.useEffect(() => {
    if (value) type()
  }, [value])
  function sendInput() {
    speak(value)
    setValue('')
  }
  const blockSend = !value

  return (
    <Tooltip open title={typingsDescription}>
      <div style={{ padding: 8 }}>
        <Grid container alignItems="flex-end" spacing={1}>
          <Grid item xs={10}>
            <TextField
              fullWidth
              label="Say something..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (!blockSend && e.keyCode === 13) {
                  sendInput()
                }
              }}
            />
          </Grid>
          <Grid item xs={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              disabled={blockSend}
              onClick={sendInput}
            >
              <Send />
            </Button>
          </Grid>
        </Grid>
      </div>
    </Tooltip>
  )
}
