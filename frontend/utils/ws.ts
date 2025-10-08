// Build a websocket URL based on current window location
export function buildWsUrl(path: string = '/ws') {
  if (typeof window === 'undefined') return ''
  const scheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  return scheme + window.location.host + path
}
