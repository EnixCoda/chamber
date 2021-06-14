import { Box, IconButton, TextField, Tooltip } from '@material-ui/core'
import { Send } from '@material-ui/icons'
import * as React from 'react'

export function MessageInput({
  speak,
  handleType,
  typingsDescription,
}: {
  speak(content: string): void
  handleType(): void
  typingsDescription?: string
}) {
  const [value, setValue] = React.useState<string>('')
  React.useEffect(() => {
    if (value) handleType()
  }, [value]) // eslint-disable-line
  function sendInput() {
    speak(value)
    setValue('')
  }
  const blockSend = !value

  return (
    <Tooltip open title={<>{typingsDescription}</>}>
      <Box display="flex" alignItems="flex-end" padding={1}>
        <Box flex="1">
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
        </Box>
        <IconButton color="primary" disabled={blockSend} onClick={sendInput}>
          <Send />
        </IconButton>
      </Box>
    </Tooltip>
  )
}
