import type { EventEmitter } from 'eventemitter3';
export interface XmppVideoRoomOptions {
  /**
   * url of XMPP server
   */
  xmppUrl: string;
  /**
   * url of webrtc-streamer (default is current location)
   */
  url: string;
  /**
   * event bus
   */
  eventBus?: EventEmitter;
}
