const search = new URLSearchParams(window.location.search)

export const SERVER_HOST =
  search.get('signaling') || process.env.REACT_APP_SERVER_HOST

if (!SERVER_HOST) throw new Error(`No server host`)

export const STUN_SERVERS = [
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
]
