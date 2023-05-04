import type { WebRTCStreamerOptions, JanusVideoRoomOptions } from '../types'

export const initialWebRTCStreamerOptions: WebRTCStreamerOptions = {
  element: '',
  url: ''
}

export const initialJanusVideoRoomOptions: JanusVideoRoomOptions = {
  janusUrl: '',
  url: '',
  eventBus: undefined
}
