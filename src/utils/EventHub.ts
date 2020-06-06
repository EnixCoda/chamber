class EventSubscription<
  Data extends any[],
  Listener extends (...data: Data) => void = (...eventData: Data) => void
> {
  listeners: Listener[] = []

  emit(...data: Data) {
    this.listeners.forEach((listener) => listener(...data))
  }

  addEventListener(listener: Listener) {
    this.listeners.push(listener)
    return () => this.removeEventListener(listener)
  }

  removeEventListener(listener: Listener) {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) this.listeners.splice(index, 1)
  }
}

export class EventHub<
  Shape extends {
    [event: string]: any[]
  }
> {
  ports: {
    [key in keyof Shape]: EventSubscription<Shape[key]>
  }

  constructor(events: (keyof Shape)[]) {
    this.ports = events.reduce((hub, event) => {
      hub[event] = new EventSubscription<Shape[typeof event]>()
      return hub
    }, {} as EventHub<Shape>['ports'])
  }

  emit<Event extends keyof Shape>(event: Event, data: Shape[Event]) {
    return this.ports[event].emit(...data)
  }

  addEventListener<Event extends keyof Shape>(
    event: Event,
    listener: (...args: Shape[Event]) => void,
  ) {
    return this.ports[event].addEventListener(listener)
  }

  removeEventListener<Event extends keyof Shape>(
    event: Event,
    listener: (...args: Shape[Event]) => void,
  ) {
    return this.ports[event].removeEventListener(listener)
  }
}
