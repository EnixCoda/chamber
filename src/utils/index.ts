export function getColor(str: string | number) {
  let v = Math.abs(Number(str)) + 3
  while (v < 0xffffff) {
    v *= v
  }
  return '#' + (v & 0xffffff).toString(16)
}

export async function waitForNextEvent<
  EventType extends string,
  Args extends any[]
>(
  target: {
    addEventListener(event: EventType, listener: (...args: Args) => any): any
    removeEventListener(event: EventType, listener: (...args: Args) => any): any
  },
  event: EventType,
  listener: (...args: Args) => void,
) {
  return new Promise<Args>((resolve) => {
    const wrappedListener = (...args: Args): any => {
      resolve(args)
      target.removeEventListener(event, wrappedListener)
      return listener(...args)
    }
    target.addEventListener(event, wrappedListener)
  })
}
