import { EventHub } from './EventHub'

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
    const connection = this.connection
    const stateMap = {
      [connection.CLOSED]: 'closed',
      [connection.CLOSING]: 'closing',
      [connection.CONNECTING]: 'connecting',
      [connection.OPEN]: 'open',
    } as const
    return stateMap[connection.readyState]
  }

  private connect() {
    this.disconnect()

    const connection = new WebSocket(`wss://${this.serverHost}`)
    this.connection = connection

    connection.addEventListener('open', () =>
      this.eventHub.ports.state.emit(this.state),
    )

    connection.addEventListener('close', () =>
      this.eventHub.ports.state.emit(this.state),
    )

    connection.addEventListener('error', () =>
      this.eventHub.ports.state.emit(this.state),
    )

    connection.addEventListener('message', (event) =>
      this.eventHub.ports.message.emit(JSON.parse(event.data)),
    )

    return connection
  }

  send(message: any) {
    this.connection.send(JSON.stringify(message))
  }

  disconnect() {
    if (this.connection) {
      this.connection.close()
    }
  }
}
