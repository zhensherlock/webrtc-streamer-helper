import type {
  WebRTCStreamerOptions,
  JanusVideoRoomOptions,
  XmppVideoRoomOptions
} from '../types'

export const initialWebRTCStreamerOptions: WebRTCStreamerOptions = {
  element: '',
  url: ''
}

export const initialJanusVideoRoomOptions: JanusVideoRoomOptions = {
  janusUrl: '',
  url: '',
  eventBus: undefined
}

export const initialXmppVideoRoomOptions: XmppVideoRoomOptions = {
  xmppUrl: '',
  url: '',
  eventBus: undefined
}
