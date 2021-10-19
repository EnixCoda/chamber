# Chamber

Multi person P2P chat room on Web.

## Features

- Instant share messages, video, audio and even screen recording
- Share between multiple users
- Sharing data are sent to peers privately, not through servers
- You can setup your own signaling server to obtain full privacy

## Signaling Server

Chamber is based on WebRTC, which needs a signaling server to let users find each other and start private P2P chat. Chat traffics are send directly between users, won't be sent to the signaling servers.

The [default signaling server](https://tkrw7.sse.codesandbox.io/) is hosted on [CodeSandbox](https://codesandbox.io/s/github/EnixCoda/chamber).

You can fork to deploy your own signaling server on CodeSandbox for extra safety needs.
