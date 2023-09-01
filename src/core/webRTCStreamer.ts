import type { MediaConstraints, WebRTCStreamerOptions } from '../types';
import { initialWebRTCStreamerOptions } from '../utils/initialization';

/**
 * Interface with WebRTC-streamer API
 */
class WebRTCStreamer {
  private element?: HTMLVideoElement;
  private options: WebRTCStreamerOptions;
  private peerConnection: RTCPeerConnection | null = null;
  private peerConnectionConfig?: RTCConfiguration;
  private peerConnectionId: number = 0;
  private mediaConstraints: MediaConstraints;
  private iceServers: RTCConfiguration | null = null;
  private earlyCandidates: RTCIceCandidate[] = [];

  /**
   * Instantiate object
   * @constructor
   * @param args
   */
  constructor(args: Partial<WebRTCStreamerOptions> = {}) {
    this.options = Object.assign({}, initialWebRTCStreamerOptions, args);
    if (!this.options.url) {
      this.options.url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
    }
    this.mediaConstraints = { offerToReceiveAudio: true, offerToReceiveVideo: true };
    this.changeElement(this.options.element);
  }

  /**
   * Connect a WebRTC Stream to videoElement
   * @param videUrl
   * @param audioUrl
   * @param options
   * @param localStream
   */
  connect(videUrl: string, audioUrl: string, options: string, localStream?: MediaStream): void {
    this.disconnect();

    if (!this.iceServers) {
      fetch(`${this.options.url}/api/getIceServers`)
        .then(this.handleHttpErrors)
        .then((res: Response) => {
          return res.json();
        })
        .then((res) => {
          return this.onReceiveGetIceServers(res, videUrl, audioUrl, options, localStream);
        })
        .catch((error) => this.onError(`getIceServers ${error}`));
    } else {
      this.onReceiveGetIceServers(this.iceServers, videUrl, audioUrl, options, localStream);
    }
  }

  /**
   * Disconnect a WebRTC Stream and clear videoElement source
   */
  disconnect(): void {
    if (this.element?.srcObject) {
      // @ts-ignore
      this.element.srcObject.getTracks().forEach((track: any) => {
        track.stop();
        // @ts-ignore
        this.element?.srcObject?.removeTrack(track);
      });
    }
    if (this.peerConnection) {
      fetch(`${this.options.url}/api/hangup?peerid=${this.peerConnectionId}`)
        .then(this.handleHttpErrors)
        .catch((error: Error) => this.onError(`hangup ${error}`));

      try {
        this.peerConnection.close();
      } catch (e) {
        console.log(`Failure close peer connection: ${e}`);
      }
      this.peerConnection = null;
    }
  }

  private changeElement(element: HTMLVideoElement | string): void {
    if (typeof element === 'string') {
      const dom = <HTMLVideoElement>document.querySelector(element);
      dom && (this.element = dom);
    } else {
      this.element = element;
    }
  }

  private handleHttpErrors(res: Response): Response {
    if (!res.ok) {
      throw Error(res.statusText);
    }
    return res;
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
  private onReceiveGetIceServers(
    iceServers: RTCConfiguration,
    videoUrl: string,
    audioUrl: string,
    options: string,
    stream?: MediaStream
  ): void {
    this.iceServers = iceServers;
    this.peerConnectionConfig = iceServers || { iceServers: [] };
    try {
      this.createPeerConnection();

      let callUrl = `${this.options.url}/api/call?peerid=${
        this.peerConnectionId
      }&url=${encodeURIComponent(videoUrl)}`;
      if (audioUrl) {
        callUrl += `&audiourl=${encodeURIComponent(audioUrl)}`;
      }
      if (options) {
        callUrl += `&options=${encodeURIComponent(options)}`;
      }

      if (stream) {
        // @ts-ignore
        this.peerConnection.addStream(stream);
      }

      // clear early candidates
      this.earlyCandidates.length = 0;

      // create Offer
      this.peerConnection?.createOffer(this.mediaConstraints).then(
        (sessionDescription) => {
          console.log(`Create offer: ${JSON.stringify(sessionDescription)}`);

          this.peerConnection?.setLocalDescription(sessionDescription).then(
            () => {
              fetch(callUrl, {
                method: 'POST',
                body: JSON.stringify(sessionDescription),
              })
                .then(this.handleHttpErrors)
                .then((res: Response) => {
                  return res.json();
                })
                .then((res) => {
                  this.onReceiveCall(res);
                })
                .catch((error) => this.onError(`call ${error}`));
            },
            (error: Error) => {
              console.log(`setLocalDescription error: ${JSON.stringify(error)}`);
            }
          );
        },
        (error: Error) => {
          console.log(`Create offer error: ${JSON.stringify(error)}`);
        }
      );
    } catch (e) {
      this.disconnect();
      console.log(`connect error: ${e}`);
    }
  }

  /**
   * AJAX callback for Error
   * @param status
   * @private
   */
  private onError(status: string): void {
    console.log(`onError: ${status}`);
  }

  /**
   * create RTCPeerConnection
   * @private
   */
  private createPeerConnection(): RTCPeerConnection {
    console.log(`createPeerConnection config: ${JSON.stringify(this.peerConnectionConfig)}`);
    this.peerConnection = new RTCPeerConnection(this.peerConnectionConfig);
    this.peerConnectionId = Math.random();

    this.peerConnection.onicecandidate = (event) => {
      this.onIceCandidate(event);
    };
    // @ts-ignore
    this.peerConnection.onaddstream = (event) => {
      this.onAddStream(event);
    };
    this.peerConnection.oniceconnectionstatechange = (evt) => {
      console.log(`oniceconnectionstatechange state: ${this.peerConnection?.iceConnectionState}`);
      if (!this.element) {
        return;
      }
      switch (this.peerConnection?.iceConnectionState) {
        case 'connected':
          (<HTMLElement>this.element).style.opacity = '1.0';
          break;
        case 'disconnected':
          (<HTMLElement>this.element).style.opacity = '0.25';
          break;
        case 'failed':
        case 'closed':
          (<HTMLElement>this.element).style.opacity = '0.5';
          break;
        case 'new':
          this.getIceCandidate();
          break;
      }
    };
    this.peerConnection.ondatachannel = function (event) {
      console.log(`remote datachannel created: ${JSON.stringify(event)}`);

      event.channel.onopen = function () {
        console.log('remote datachannel open');
        this.send('remote channel opened');
      };
      event.channel.onmessage = function (event) {
        console.log(`remote datachannel receive: ${JSON.stringify(event.data)}`);
      };
    };
    this.peerConnection.onicegatheringstatechange = () => {
      if (this.peerConnection?.iceGatheringState === 'complete') {
        const receivers = this.peerConnection.getReceivers();

        receivers.forEach((receiver) => {
          if (receiver.track && receiver.track.kind === 'video') {
            console.log(`codecs: ${JSON.stringify(receiver.getParameters().codecs)}`);
          }
        });
      }
    };

    try {
      const dataChannel = this.peerConnection.createDataChannel('ClientDataChannel');
      dataChannel.onopen = function () {
        console.log('local datachannel open');
        this.send('local channel opened');
      };
      dataChannel.onmessage = function (event) {
        console.log(`local datachannel receiver: ${JSON.stringify(event.data)}`);
      };
    } catch (e) {
      console.log(`Cannot create datachannel error: ${e}`);
    }

    console.log(
      `Created RTCPeerConnection with config: ${JSON.stringify(this.peerConnectionConfig)}`
    );
    return this.peerConnection;
  }

  /**
   * AJAX /call callback
   * @param dataJson
   * @private
   */
  private onReceiveCall(dataJson: RTCSessionDescriptionInit): void {
    console.log(`offer: ${JSON.stringify(dataJson)}`);
    const sessionDescription = new RTCSessionDescription(dataJson);
    this.peerConnection?.setRemoteDescription(sessionDescription).then(
      () => {
        console.log('setRemoteDescription ok');
        while (this.earlyCandidates.length) {
          const candidate = this.earlyCandidates.shift();
          this.addIceCandidate(this.peerConnectionId, candidate);
        }
        this.getIceCandidate();
      },
      (error: Error) => {
        console.log(`setRemoteDescription error: ${JSON.stringify(error)}`);
      }
    );
  }

  private addIceCandidate(id: number, candidate: any): void {
    fetch(`${this.options.url}/api/addIceCandidate?peerid=${id}`, {
      method: 'POST',
      body: JSON.stringify(candidate),
    })
      .then(this.handleHttpErrors)
      .then((res: Response) => {
        return res.json();
      })
      .then((res) => {
        console.log(`addIceCandidate ok: ${res}`);
      })
      .catch((error) => this.onError(`addIceCandidate ${error}`));
  }

  private getIceCandidate(): void {
    fetch(`${this.options.url}/api/getIceCandidate?peerid=${this.peerConnectionId}`)
      .then(this.handleHttpErrors)
      .then((res: Response) => {
        return res.json();
      })
      .then((res) => {
        this.onReceiveCandidate(res);
      })
      .catch((error) => this.onError(`getIceCandidate ${error}`));
  }

  /**
   * AJAX /getIceCandidate callback
   * @param dataJson
   * @private
   */
  private onReceiveCandidate(dataJson: RTCIceCandidateInit[]): void {
    console.log(`candidate: ${JSON.stringify(dataJson)}`);
    if (dataJson) {
      for (let i = 0; i < dataJson.length; i++) {
        const candidate = new RTCIceCandidate(dataJson[i]);
        console.log(`Adding ICE candidate: ${JSON.stringify(candidate)}`);
        this.peerConnection?.addIceCandidate(candidate).then(
          () => {
            console.log('addIceCandidate OK');
          },
          (error: Error) => {
            console.log(`addIceCandidate error: ${JSON.stringify(error)}`);
          }
        );
      }
      this.peerConnection?.addIceCandidate();
    }
  }

  /**
   * RTCPeerConnection AddTrack callback
   * @param event
   * @private
   */
  private onAddStream(event: any): void {
    console.log(`Remote track added: ${JSON.stringify(event)}`);

    this.element!.srcObject = event.stream;
    const promise = (<HTMLVideoElement>this.element).play();
    if (promise !== undefined) {
      promise.catch((error: Error) => {
        console.warn(`error: ${error}`);
        this.element?.setAttribute('controls', 'true');
      });
    }
  }

  /**
   * RTCPeerConnection IceCandidate callback
   * @param event
   * @private
   */
  private onIceCandidate(event: RTCPeerConnectionIceEvent): void {
    if (event.candidate) {
      if (this.peerConnection?.currentRemoteDescription) {
        this.addIceCandidate(this.peerConnectionId, event.candidate);
      } else {
        this.earlyCandidates.push(event.candidate);
      }
    } else {
      console.log('End of candidates.');
    }
  }
}

export { WebRTCStreamer };
