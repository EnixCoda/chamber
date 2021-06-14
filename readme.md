# Chamber

Multi person P2P chat room on Web.

## Features

- Instant share messages, video, and audio between multiple peers
- Messages and media stream are sent between peers directly, not through server
- Alternative signaling server available

## Signaling Server

Chamber is based on WebRTC, which needs a signaling server to let users find each other and start private P2P chat. Chat traffics are send directly between users, won't be sent to the signaling servers.

You can fork and deploy your own signaling server [here](packages/signaling) for extra safety needs.
