import type { EventEmitter } from 'eventemitter3';

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
  eventBus?: EventEmitter;
}

export interface JanusVideoRoomAdvancedUrl {
  video?: string;
  audio?: string;
  options?: string;
}
