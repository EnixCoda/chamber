import * as React from 'react'

export function useRerender() {
  const [, setCount] = React.useState(0)
  return React.useCallback(() => setCount((count) => count + 1), [])
}
