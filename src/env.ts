export const SERVER_HOST = process.env.REACT_APP_SERVER_HOST || ''
export const DEFAULT_SERVER = process.env.REACT_APP_DEFAULT_SERVER || ''

export const DETECT_TRACKS = process.env.REACT_APP_DETECT_TRACKS === 'true' // TODO: detect tracks accurately

export const STUN_SERVERS = [
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
]
