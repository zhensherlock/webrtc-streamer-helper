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
