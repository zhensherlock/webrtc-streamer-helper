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
