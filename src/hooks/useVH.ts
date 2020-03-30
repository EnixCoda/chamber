import * as React from 'react'

let lock = false
function setViewHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

export function useVH() {
  React.useLayoutEffect(() => {
    if (lock) return
    lock = true
    setViewHeight()

    window.addEventListener('resize', () => {
      setViewHeight()
    })
  }, [])
}
