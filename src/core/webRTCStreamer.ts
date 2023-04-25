import { WebRTCStreamerOptions } from '../types'
// import { initialOptions } from '../utils/initialization'

export default class WebRTCStreamer {
  // private element: Element
  // private options: WebRTCStreamerOptions
  //
  // private pc: any
  // private mediaConstraints = { offerToReceiveAudio: true, offerToReceiveVideo: true }
  // private iceServers = null
  // private earlyCandidates = []
  constructor (args: Partial<WebRTCStreamerOptions> = {}) {
    const a = 1
    const b = 1
    const c = a + b
    document.title = c.toString()
    // this.options = Object.assign({}, initialOptions, args)
    // this.changeElement(this.options.element)
  }

  // connect (videURL, audioURL, options, localStream) {
  //   this.disconnect()
  //
  //   if (!this.iceServers) {
  //     fetch(`${this.options.url}/api/getIceServers`)
  //       .then(this.handleHttpErrors)
  //       .then((res) => (res.json()))
  //       .then((resp) =>  this.onReceiveGetIceServers(resp, videURL, audioURL, options, localStream))
  //       .catch((error) => this.onError(`getIceServers ${error}`))
  //   } else {
  //     this.onReceiveGetIceServers(this.iceServers, videURL, audioURL, options, localStream);
  //   }
  // }
  //
  // disconnect () {
  //   if (this.element?.srcObject) {
  //     this.element.srcObject.getTracks().forEach(track => {
  //       track.stop()
  //       this.element.srcObject.removeTrack(track)
  //     })
  //   }
  //   if (this.pc) {
  //     fetch(`${this.options.url}/api/hangup?peerid=${this.pc.peerid}`)
  //       .then(this.handleHttpErrors)
  //       .catch((error) => this.onError(`hangup ${error}`))
  //
  //     try {
  //       this.pc.close()
  //     }
  //     catch (e) {
  //       console.log(`Failure close peer connection:${e}`)
  //     }
  //     this.pc = null
  //   }
  // }
  //
  // private changeElement (ele: Element | string) {
  //   if (typeof ele === 'string') {
  //     const dom = document.querySelector(ele)
  //     dom && (this.element = dom)
  //   } else {
  //     this.element = ele
  //   }
  // }
  //
  // private handleHttpErrors (resp) {
  //   if (!resp.ok) {
  //     throw Error(resp.statusText)
  //   }
  //   return resp
  // }
  //
  // private onReceiveGetIceServers (iceServers, videourl, audiourl, options, stream) {
  //   this.iceServers       = iceServers;
  //   this.pcConfig         = iceServers || {"iceServers": [] };
  //   try {
  //     this.createPeerConnection();
  //
  //     var callurl = this.srvurl + "/api/call?peerid=" + this.pc.peerid + "&url=" + encodeURIComponent(videourl);
  //     if (audiourl) {
  //       callurl += "&audiourl="+encodeURIComponent(audiourl);
  //     }
  //     if (options) {
  //       callurl += "&options="+encodeURIComponent(options);
  //     }
  //
  //     if (stream) {
  //       this.pc.addStream(stream);
  //     }
  //
  //     // clear early candidates
  //     this.earlyCandidates.length = 0;
  //
  //     // create Offer
  //     this.pc.createOffer(this.mediaConstraints).then((sessionDescription) => {
  //       console.log("Create offer:" + JSON.stringify(sessionDescription));
  //
  //       this.pc.setLocalDescription(sessionDescription)
  //         .then(() => {
  //           fetch(callurl, { method: "POST", body: JSON.stringify(sessionDescription) })
  //             .then(this.handleHttpErrors)
  //             .then( (response) => (response.json()) )
  //             .catch( (error) => this.onError("call " + error ))
  //             .then( (response) =>  this.onReceiveCall(response) )
  //             .catch( (error) => this.onError("call " + error ))
  //
  //         }, (error: any) => {
  //           console.log ("setLocalDescription error:" + JSON.stringify(error));
  //         });
  //
  //     }, (error: any) => {
  //       alert("Create offer error: " + JSON.stringify(error));
  //     });
  //
  //   } catch (e) {
  //     this.disconnect()
  //     alert('connect error: ' + e)
  //   }
  // }
  //
  // private onError(status: any) {
  //   console.log(`onError:${status}`)
  // }
  //
  // private onReceiveCall(dataJson) {
  //   console.log("offer: " + JSON.stringify(dataJson));
  //   var descr = new RTCSessionDescription(dataJson);
  //   this.pc.setRemoteDescription(descr).then(() =>  {
  //     console.log ("setRemoteDescription ok");
  //     while (this.earlyCandidates.length) {
  //       var candidate = this.earlyCandidates.shift();
  //       this.addIceCandidate(this.pc.peerid, candidate);
  //     }
  //
  //     this.getIceCandidate()
  //   }, (error) => {
  //     console.log ("setRemoteDescription error:" + JSON.stringify(error))
  //   })
  // }
}
