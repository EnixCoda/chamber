import { IconButton, Snackbar } from '@material-ui/core'
import { Share } from '@material-ui/icons'
import { Alert } from '@material-ui/lab'
import * as React from 'react'
import { useCopyToClipboard } from 'react-use'

export function ShareLink() {
  const [, copyToClipboard] = useCopyToClipboard()
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <IconButton
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
          copyToClipboard(window.location.href)
        }}
      >
        <Share />
      </IconButton>
      <Snackbar
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={3 * 1000}
      >
        <Alert severity="success">Link copied!</Alert>
      </Snackbar>
    </>
  )
}
