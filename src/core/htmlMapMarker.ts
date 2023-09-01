/// <reference types="google.maps" />

/**
 * Interface with WebRTC-streamer API
 */
import type { HtmlMapMarkerOptions } from '../types';

class HtmlMapMarker extends google.maps.OverlayView {
  /**
   * marker position
   * @private
   */
  private readonly latLng: google.maps.LatLng;
  /**
   * marker content
   * @private
   */
  private readonly html: string;
  /**
   * map instance
   * @private
   */
  private readonly map: google.maps.Map;
  /**
   * marker width
   * @private
   */
  private width: number;
  /**
   * marker height
   * @private
   */
  private height: number;
  /**
   * div for marker content
   * @private
   */
  private div?: HTMLDivElement;

  /**
   * Instantiate object
   * accepts latLng, html, map etc
   * @constructor
   * @param args
   */
  constructor(args: HtmlMapMarkerOptions) {
    super();
    this.latLng = args.latLng;
    this.html = args.html;
    this.map = args.map;
    this.width = args.width;
    this.height = args.height;
    this.setMap(args.map);
  }

  /**
   * create a div to hold the marker content
   */
  createDiv(): void {
    this.div = document.createElement('div');
    this.div.style.position = 'absolute';
    if (this.width && this.height) {
      this.div.style.width = `${this.width}px`;
      this.div.style.height = `${this.height}px`;
    }
    if (this.html) {
      this.div.innerHTML = this.html;
    }

    google.maps.event.addDomListener(this.div, 'click', (event: any) => {
      event.stopPropagation();
      google.maps.event.trigger(this, 'click', event);
    });
  }

  /**
   * position the marker div
   */
  positionDiv(): void {
    const point = this.getProjection().fromLatLngToDivPixel(this.latLng);
    if (point) {
      const left = point.x - this.div!.clientWidth / 2;
      this.div!.style.left = `${left}px`;
      const top = point.y - this.div!.clientHeight / 2;
      this.div!.style.top = `${top}px`;
    }
  }

  /**
   * add the marker div to the map
   */
  onAdd(): void {
    if (!this.div) {
      this.createDiv();
      const panes = this.getPanes();
      panes?.overlayMouseTarget.appendChild(this.div!);
    }
    this.positionDiv();
  }

  /**
   * reposition the marker div
   */
  draw() {
    this.positionDiv();
  }

  /**
   * remove the marker div from the map
   */
  onRemove(): void {
    if (this.div) {
      this.div.parentNode?.removeChild(this.div);
      this.div = undefined;
    }
  }

  /**
   * get the marker position
   */
  getPosition(): google.maps.LatLng {
    return this.latLng;
  }

  /**
   * remove the marker from the map
   */
  detach(): void {
    if (this.getMap()) {
      this.setMap(null);
    }
  }

  /**
   * attach the marker to the map
   * @param map
   */
  attach(map?: google.maps.Map): void {
    if (!this.getMap()) {
      this.setMap(map || this.map);
    }
  }

  /**
   * set size of the marker div
   * @param width
   * @param height
   */
  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.div) {
      this.div.style.width = `${this.width}px`;
      this.div.style.height = `${this.height}px`;
    }
  }
}

export { HtmlMapMarker };
