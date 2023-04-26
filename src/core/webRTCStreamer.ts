import { WebRTCStreamerOptions } from '../types'
import { initialOptions } from '../utils/initialization'

export default class WebRTCStreamer {
  private element?: Element
  private options: WebRTCStreamerOptions
  private peerConnection: RTCPeerConnection | null = null
  private peerConnectionConfig?: RTCConfiguration
  private peerId: number = 0
  private mediaConstraints = { offerToReceiveAudio: true, offerToReceiveVideo: true }
  private iceServers: RTCConfiguration | null = null
  private earlyCandidates: RTCIceCandidate[] = []
  private srcObject: any

  constructor (args: Partial<WebRTCStreamerOptions> = {}) {
    this.options = Object.assign({}, initialOptions, args)
    this.changeElement(this.options.element)
  }

  /**
   * Connect a WebRTC Stream to videoElement
   * @param videUrl
   * @param audioUrl
   * @param options
   * @param localStream
   */
  connect (videUrl: string, audioUrl: string, options: string, localStream: any) {
    this.disconnect()

    if (!this.iceServers) {
      fetch(`${this.options.url}/api/getIceServers`).then(
        this.handleHttpErrors
      ).then((resp: Response) => {
        return resp.json()
      }).then((resp) => {
        return this.onReceiveGetIceServers(resp, videUrl, audioUrl, options, localStream)
      }).catch((error) => this.onError(`getIceServers ${error}`))
    } else {
      this.onReceiveGetIceServers(this.iceServers, videUrl, audioUrl, options, localStream)
    }
  }

  /**
   * Disconnect a WebRTC Stream and clear videoElement source
   */
  disconnect () {
    if (this.srcObject) {
      this.srcObject.getTracks().forEach((track: any) => {
        track.stop()
        this.srcObject.removeTrack(track)
      })
    }
    if (this.peerConnection) {
      fetch(`${this.options.url}/api/hangup?peerid=${this.peerId}`).then(
        this.handleHttpErrors
      ).catch((error: Error) => this.onError(`hangup ${error}`))

      try {
        this.peerConnection.close()
      } catch (e) {
        console.log(`Failure close peer connection: ${e}`)
      }
      this.peerConnection = null
    }
  }

  private changeElement (element: Element | string) {
    if (typeof element === 'string') {
      const dom = document.querySelector(element)
      dom && (this.element = dom)
    } else {
      this.element = element
    }
  }

  private handleHttpErrors (resp: Response) {
    if (!resp.ok) {
      throw Error(resp.statusText)
    }
    return resp
  }

  /**
   * GetIceServers callback
   * @param iceServers
   * @param videoUrl
   * @param audioUrl
   * @param options
   * @param stream
   * @private
   */
  private onReceiveGetIceServers (iceServers: RTCConfiguration, videoUrl: string, audioUrl: string, options: string, stream: any) {
    this.iceServers = iceServers
    this.peerConnectionConfig = iceServers || { 'iceServers': [] }
    try {
      this.createPeerConnection()

      let callUrl = `${this.options.url}/api/call?peerId=${this.peerId}&url=${encodeURIComponent(videoUrl)}`
      if (audioUrl) {
        callUrl += `&audiourl=${encodeURIComponent(audioUrl)}`
      }
      if (options) {
        callUrl += `&options=${encodeURIComponent(options)}`
      }

      if (stream) {
        // @ts-ignore
        this.peerConnection.addStream(stream)
      }

      // clear early candidates
      this.earlyCandidates.length = 0

      // create Offer
      this.peerConnection?.createOffer(this.mediaConstraints).then((sessionDescription) => {
        console.log(`Create offer: ${JSON.stringify(sessionDescription)}`)

        this.peerConnection?.setLocalDescription(sessionDescription).then(() => {
          fetch(callUrl, {
            method: 'POST',
            body: JSON.stringify(sessionDescription)
          }).then(
            this.handleHttpErrors
          ).then((resp: Response) => {
            return resp.json()
          }).then((resp) => {
            this.onReceiveCall(resp)
          }).catch((error) => this.onError(`call ${error}`))
        }, (error: Error) => {
          console.log(`setLocalDescription error: ${JSON.stringify(error)}`)
        })
      }, (error: Error) => {
        console.log(`Create offer error: ${JSON.stringify(error)}`)
      })
    } catch (e) {
      this.disconnect()
      console.log(`connect error: ${e}`)
    }
  }

  /**
   * AJAX callback for Error
   * @param status
   * @private
   */
  private onError (status: any) {
    console.log(`onError: ${status}`)
  }

  /**
   * create RTCPeerConnection
   * @private
   */
  private createPeerConnection () {
    console.log(`createPeerConnection config: ${JSON.stringify(this.peerConnectionConfig)}`)
    this.peerConnection = new RTCPeerConnection(this.peerConnectionConfig)
    this.peerId = Math.random()

    this.peerConnection.onicecandidate = (event) => {
      this.onIceCandidate(event)
    }
    // @ts-ignore
    this.peerConnection.onaddstream = (event) => {
      this.onAddStream(event)
    }
    this.peerConnection.oniceconnectionstatechange = (evt) => {
      console.log(`oniceconnectionstatechange state: ${this.peerConnection?.iceConnectionState}`)
      if (!this.element) {
        return
      }
      switch (this.peerConnection?.iceConnectionState) {
        case 'connected':
          (<HTMLElement>this.element).style.opacity = '1.0'
          break
        case 'disconnected':
          (<HTMLElement>this.element).style.opacity = '0.25'
          break
        case 'failed':
        case 'closed':
          (<HTMLElement>this.element).style.opacity = '0.5'
          break
        case 'new':
          this.getIceCandidate()
          break
      }
    }
    this.peerConnection.ondatachannel = function(event) {
      console.log(`remote datachannel created: ${JSON.stringify(event)}`)

      event.channel.onopen = function () {
        console.log('remote datachannel open')
        this.send('remote channel opened')
      }
      event.channel.onmessage = function (event) {
        console.log(`remote datachannel receive: ${JSON.stringify(event.data)}`)
      }
    }
    this.peerConnection.onicegatheringstatechange = () => {
      if (this.peerConnection?.iceGatheringState === 'complete') {
        const receivers = this.peerConnection.getReceivers()

        receivers.forEach((receiver) => {
          if (receiver.track && receiver.track.kind === 'video') {
            console.log(`codecs: ${JSON.stringify(receiver.getParameters().codecs)}`)
          }
        })
      }
    }

    try {
      const dataChannel = this.peerConnection.createDataChannel('ClientDataChannel')
      dataChannel.onopen = function() {
        console.log('local datachannel open')
        this.send('local channel opened')
      }
      dataChannel.onmessage = function(event) {
        console.log(`local datachannel receiver: ${JSON.stringify(event.data)}`)
      }
    } catch (e) {
      console.log(`Cannot create datachannel error: ${e}`)
    }

    console.log(`Created RTCPeerConnection with config: ${JSON.stringify(this.peerConnectionConfig)}`)
    return this.peerConnection
  }

  /**
   * AJAX /call callback
   * @param dataJson
   * @private
   */
  private onReceiveCall (dataJson: RTCSessionDescriptionInit) {
    console.log(`offer: ${JSON.stringify(dataJson)}`)
    const sessionDescription = new RTCSessionDescription(dataJson)
    this.peerConnection?.setRemoteDescription(sessionDescription).then(() => {
      console.log('setRemoteDescription ok')
      while (this.earlyCandidates.length) {
        const candidate = this.earlyCandidates.shift()
        this.addIceCandidate(this.peerId, candidate)
      }
      this.getIceCandidate()
    }, (error: Error) => {
      console.log(`setRemoteDescription error: ${JSON.stringify(error)}`)
    })
  }

  private addIceCandidate (id: number, candidate: any) {
    fetch(
      `${this.options.url}/api/addIceCandidate?peerid=${id}`,
      { method: 'POST', body: JSON.stringify(candidate) }
    ).then(
      this.handleHttpErrors
    ).then((resp: Response) => {
      return resp.json()
    }).then((resp) => {
      console.log(`addIceCandidate ok: ${resp}`)
    }).catch((error) => this.onError(`addIceCandidate ${error}`))
  }

  private getIceCandidate () {
    fetch(
      `${this.options.url}/api/getIceCandidate?peerid=${this.peerId}`
    ).then(
      this.handleHttpErrors
    ).then((resp: Response) => {
      return resp.json()
    }).then((resp) => {
      this.onReceiveCandidate(resp)
    }).catch((error) => this.onError(`getIceCandidate ${error}`))
  }

  /**
   * AJAX /getIceCandidate callback
   * @param dataJson
   * @private
   */
  private onReceiveCandidate (dataJson: RTCIceCandidateInit[]) {
    console.log(`candidate: ${JSON.stringify(dataJson)}`)
    if (dataJson) {
      for (let i = 0; i < dataJson.length; i++) {
        const candidate = new RTCIceCandidate(dataJson[i])
        console.log(`Adding ICE candidate: ${JSON.stringify(candidate)}`)
        this.peerConnection?.addIceCandidate(candidate).then(() => {
          console.log('addIceCandidate OK')
        }, (error: Error) => {
          console.log(`addIceCandidate error: ${JSON.stringify(error)}`)
        })
      }
      this.peerConnection?.addIceCandidate()
    }
  }

  /**
   * RTCPeerConnection AddTrack callback
   * @param event
   * @private
   */
  private onAddStream (event: any) {
    console.log(`Remote track added: ${JSON.stringify(event)}`)

    this.srcObject = event.stream
    const promise = (<HTMLVideoElement>this.element).play()
    if (promise !== undefined) {
      promise.catch((error: Error) => {
        console.warn(`error: ${error}`)
        this.element?.setAttribute('controls', 'true')
      })
    }
  }

  /**
   * RTCPeerConnection IceCandidate callback
   * @param event
   * @private
   */
  private onIceCandidate (event: RTCPeerConnectionIceEvent) {
    if (event.candidate) {
      if (this.peerConnection?.currentRemoteDescription)  {
        this.addIceCandidate(this.peerId, event.candidate)
      } else {
        this.earlyCandidates.push(event.candidate)
      }
    }
    else {
      console.log('End of candidates.')
    }
  }
}
