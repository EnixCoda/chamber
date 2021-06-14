import * as React from 'react'
import { render } from 'react-dom'
import 'webrtc-adapter'
import App from './App'

const rootElement = document.getElementById('root')
render(<App />, rootElement)
