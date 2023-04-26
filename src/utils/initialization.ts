import type { WebRTCStreamerOptions } from '../types'

export const initialOptions: WebRTCStreamerOptions = {
  element: '',
  url: `${location.protocol}//${location.hostname}:${location.port}`
}
