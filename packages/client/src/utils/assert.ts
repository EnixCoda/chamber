export function assert(
  condition: boolean,
  config: { msg?: string; shouldThrow?: boolean; debug?: boolean } = {},
) {
  if (!condition) {
    const { msg, shouldThrow, debug } = config
    if (debug) debugger
    if (msg && !shouldThrow) console.error(msg)
    else throw new Error(msg || `Assertion failed`)
  }
}
