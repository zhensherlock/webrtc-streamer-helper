export interface WebRTCStreamerOptions {
  /**
   * id of the video element tag
   */
  element: HTMLVideoElement | string;
  /**
   * url of webrtc-streamer (default is current location)
   */
  url: string;
}

export type MediaConstraints = {
  offerToReceiveAudio: boolean;
  offerToReceiveVideo: boolean;
}

export interface HtmlMapMarkerOptions {
  /**
   * marker position
   */
  latLng: google.maps.LatLng,
  /**
   * marker content
   */
  html: string,
  /**
   * map instance
   */
  map: google.maps.Map,
  /**
   * marker width
   */
  width: number,
  /**
   * marker height
   */
  height: number
}

export interface JanusVideoRoomOptions {
  /**
   * url of Janus Gateway
   */
  janusUrl: string;
  /**
   * url of webrtc-streamer (default is current location)
   */
  url: string;
  /**
   * event bus
   */
  eventBus?: any;
}

export interface JanusVideoRoomAdvancedUrl {
  video?: string,
  audio?: string,
  options?: string
}
