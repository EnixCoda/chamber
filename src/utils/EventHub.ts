export class EventHub<
  EventData extends any[],
  Listener extends (...eventData: EventData) => void = (
    ...eventData: EventData
  ) => void
> {
  listeners: (Listener)[] = []

  emit(...eventData: EventData) {
    this.listeners.forEach((listener) => listener(...eventData))
  }

  addEventListener(listener: Listener) {
    this.listeners.push(listener)
    return () => this.removeListener(listener)
  }

  removeListener(listener: Listener) {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) this.listeners.splice(index, 1)
  }
}
