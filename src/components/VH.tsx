import * as React from 'react'

let lock = false // there should be no more than 1 instance of this component taking effect

const variableName = '--vh'

function setViewHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty(variableName, `${vh}px`)

  return () => document.documentElement.style.removeProperty(variableName)
}

export function VH(props: React.PropsWithChildren<{}>) {
  React.useLayoutEffect(() => {
    if (lock) return
    lock = true
    const removeStyle = setViewHeight()

    window.addEventListener('resize', setViewHeight)
    return () => {
      lock = false
      removeStyle()
      window.removeEventListener('resize', setViewHeight)
    }
  }, [])

  return <>{props.children}</>
}

export function useVH() {
  return { height: `calc(var(${variableName}, 1vh) * 100)` }
}
