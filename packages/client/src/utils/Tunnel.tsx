import { EventHub } from './EventHub'
import { isLocalhost } from './isLocalhost'

const webSocketStateMap = {
  [WebSocket.CLOSED]: 'closed',
  [WebSocket.CLOSING]: 'closing',
  [WebSocket.CONNECTING]: 'connecting',
  [WebSocket.OPEN]: 'open',
} as const

export class Tunnel {
  private connection: WebSocket
  serverHost: string

  eventHub = new EventHub<{
    message: [any]
    state: [Tunnel['state']]
  }>(['message', 'state'])

  constructor(serverHost: string) {
    this.serverHost = serverHost
    this.connection = this.connect()
  }

  destruct() {
    this.disconnect()
  }

  get state() {
    return webSocketStateMap[this.connection.readyState]
  }

  private connect() {
    this.disconnect()

    const connection = new WebSocket(
      `${isLocalhost(this.serverHost) ? 'ws' : 'wss'}://${this.serverHost}`,
    )
    this.connection = connection

    connection.addEventListener('open', () =>
      this.eventHub.emit('state', [this.state]),
    )

    connection.addEventListener('close', () =>
      this.eventHub.emit('state', [this.state]),
    )

    connection.addEventListener('error', () =>
      this.eventHub.emit('state', [this.state]),
    )

    connection.addEventListener('message', (event) =>
      this.eventHub.emit('message', [JSON.parse(event.data)]),
    )

    return connection
  }

  send(message: any) {
    if (this.state === 'open') this.connection.send(JSON.stringify(message))
    else
      console.warn(
        '[Tunnel]',
        `Trying to send message while tunnel is ${this.state}`,
        message,
      )
  }

  disconnect() {
    // necessary condition as disconnect is called in connect
    if (this.connection) {
      this.connection.close()
    }
  }
}
