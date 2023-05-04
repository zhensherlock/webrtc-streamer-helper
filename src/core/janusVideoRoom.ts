import { JanusVideoRoomOptions, JanusVideoRoomAdvancedUrl } from '../types'
import { initialJanusVideoRoomOptions } from '../utils/initialization'

/**
 * Interface with Janus Gateway Video Room and WebRTC-streamer API
 */
class JanusVideoRoom {
  private options: JanusVideoRoomOptions
  private readonly connection: { [key: string]: { sessionId: string, pluginId: string } } = {}

  /**
   * Instantiate object
   * @constructor
   * @param args
   */
  constructor (args: Partial<JanusVideoRoomOptions> = {}) {
    this.options = Object.assign({}, initialJanusVideoRoomOptions, args)
    this.options.url = this.options.url || `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
  }

  /**
   * Ask to publish a stream from WebRTC-streamer in a Janus Video Room user
   * @param janusRoomId - id of the Janus Video Room to join
   * @param url - WebRTC stream to publish
   * @param name - name in Janus Video Room
   */
  join (janusRoomId: string, url: string, name: string): void {
    const createRequest = {
      janus: 'create',
      transaction: Math.random().toString()
    }
    fetch(this.options.janusUrl, {
      method: 'POST', body: JSON.stringify(createRequest)
    }).then(
      this.handleHttpErrors
    ).then((res: Response) => {
      return res.json()
    }).then((res) => {
      this.onCreateSession(res, janusRoomId, url, name)
    }).catch((error: Error) => this.onError(`create ${error}`))
  }

  leave (janusRoomId: string, url: string, name: string): void {
    const connection = this.connection[`${janusRoomId}_${url}_${name}`]
    if (connection) {
      const sessionId = connection.sessionId
      const pluginId  = connection.pluginId

      const leaveRequest = {
        janus: 'message',
        body: {
          request: 'unpublish'
        },
        transaction: Math.random().toString()
      }
      fetch(`${this.options.janusUrl}/${sessionId}/${pluginId}`, {
        method: 'POST',
        body: JSON.stringify(leaveRequest)
      }).then(
        this.handleHttpErrors
      ).then((res) => {
        return res.json()
      }).then((res) => {
        console.log(`leave janus room answer: ${res}`)
      }).catch((error: Error) => this.onError(`leave ${error}`))
    }
  }

  private handleHttpErrors (res: Response): Response {
    if (!res.ok) {
      throw Error(res.statusText)
    }
    return res
  }

  private emit (name: string, state: string) {
    this.options.eventBus?.emit('state', name, state)
  }

  /**
   * Janus callback for Session Creation
   * @param dataJson
   * @param janusRoomId
   * @param url
   * @param name
   * @private
   */
  private onCreateSession (dataJson: any, janusRoomId: string, url: string, name: string) {
    const sessionId = dataJson.data.id
    console.log(`onCreateSession sessionId: ${sessionId}`)

    // attach to video room plugin
    const attachRequest = {
      janus: 'attach',
      plugin: 'janus.plugin.videoroom',
      transaction: Math.random().toString()
    }

    fetch(`${this.options.janusUrl}/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(attachRequest)
    }).then(
      this.handleHttpErrors
    ).then((res: Response) => {
      return res.json()
    }).then((res) => {
      this.onPluginsAttached(res, janusRoomId, url, name, sessionId)
    }).catch((error: Error) => this.onError(`attach ${error}`))
  }

  /**
   * Janus callback for Video Room Plugins Connection
   * @param dataJson
   * @param janusRoomId
   * @param url
   * @param name
   * @param sessionId
   * @private
   */
  private onPluginsAttached (dataJson: any, janusRoomId: string, url: string, name: string, sessionId: string) {
    const pluginId = dataJson.data.id
    console.log(`onPluginsAttached pluginId: ${pluginId}`)
    this.emit(name, 'joining')
    const joinRequest = {
      janus: 'message',
      body: {
        request: 'join',
        room: janusRoomId,
        ptype: 'publisher',
        display: name
      },
      transaction: Math.random().toString()
    }
    fetch(`${this.options.janusUrl}/${sessionId}/${pluginId}`, {
      method: 'POST', body: JSON.stringify(joinRequest)
    }).then(
      this.handleHttpErrors
    ).then((res) => {
      return res.json()
    }).then((response) => {
      this.onJoinRoom(response, janusRoomId, url, name, sessionId, pluginId)
    }).catch((error: Error) => this.onError(`join ${error}`))
  }

  /**
   * Janus callback for Video Room Joined
   * @param dataJson
   * @param janusRoomId
   * @param url
   * @param name
   * @param sessionId
   * @param pluginId
   * @private
   */
  private onJoinRoom(dataJson: any, janusRoomId: string, url: string, name: string, sessionId: string, pluginId: string) {
    console.log(`onJoinRoom: ${JSON.stringify(dataJson)}`)

    fetch(`${this.options.janusUrl}/${sessionId}?rid=${new Date().getTime()}&maxev=1`).then(
      this.handleHttpErrors
    ).then(response => {
      return response.json()
    }).then(response => {
      this.onJoinRoomResult(response, janusRoomId, url, name, sessionId, pluginId)
    }).catch(error => this.onError(`join answer ${error}`))
  }

  /**
   * Janus callback for Video Room Joined
   * @param dataJson
   * @param janusRoomId
   * @param url
   * @param name
   * @param sessionId
   * @param pluginId
   * @private
   */
  private onJoinRoomResult(dataJson: any, janusRoomId: string, url: JanusVideoRoomAdvancedUrl | string, name: string, sessionId: string, pluginId: string) {
    console.log(`onJoinRoomResult: ${JSON.stringify(dataJson)}`)

    if (dataJson.plugindata.data.videoroom === 'joined') {
      // register connection
      this.connection[`${janusRoomId}_${url}_${name}`] = { sessionId, pluginId }

      // member of the room
      const publishers = dataJson.plugindata.data.publishers
      for (let i = 0; i < publishers.length; i++) {
        const publisher = publishers[i]
        this.emit(publisher.display, 'up')
      }

      if (name) {
        // notify new state
        this.emit(name, 'joined')

        const peerId = Math.random().toString()
        let createOfferUrl: string

        if (typeof url === 'string') {
          createOfferUrl = `${this.options.url}/api/createOffer?peerid=${peerId}&url=${encodeURIComponent(url)}`
        } else {
          createOfferUrl = `${this.options.url}/api/createOffer?peerid=${peerId}&url=${encodeURIComponent(url.video || '')}`
          if (url.audio) {
            createOfferUrl += `&audiourl=${encodeURIComponent(url.audio)}`
          }
          if (url.options) {
            createOfferUrl += `&options=${encodeURIComponent(url.options)}`
          }
        }

        fetch(createOfferUrl).then(
          this.handleHttpErrors
        ).then(res => {
          return res.json()
        }).then(res => {
          this.onCreateOffer(res, name, sessionId, pluginId, peerId)
        }).catch(error => this.onError(`createOffer ${error}`))
      } else {
        // start long polling
        this.longPoll(null, name, sessionId)
      }
    } else {
      this.emit(name, 'joining room failed')
    }
  }

  /**
   * WebRTC streamer callback for Offer
   * @param dataJson
   * @param name
   * @param sessionId
   * @param pluginId
   * @param peerId
   * @private
   */
  private onCreateOffer(dataJson: any, name: string, sessionId: string, pluginId: string, peerId: string) {
    console.log(`onCreateOffer: ${JSON.stringify(dataJson)}`)

    this.emit(name, 'publishing')

    const publishReq = {
      janus: 'message',
      body: { request: 'publish', video: true, audio: true, data: true },
      jsep: dataJson,
      transaction: Math.random().toString()
    }

    fetch(`${this.options.janusUrl}/${sessionId}/${pluginId}`, {
      method: 'POST',
      body: JSON.stringify(publishReq)
    }).then(
      this.handleHttpErrors
    ).then(res => {
      return res.json()
    }).then(res => {
      this.onPublishStream(res, name, sessionId, pluginId, peerId)
    }).catch(error => this.onError(`publish ${error}`))
  }

  /**
   * Janus callback for WebRTC stream is published
   * @param dataJson
   * @param name
   * @param sessionId
   * @param pluginId
   * @param peerId
   * @private
   */
  private onPublishStream(dataJson: any, name: string, sessionId: string, pluginId: string, peerId: string) {
    console.log(`onPublishStream: ${JSON.stringify(dataJson)}`)

    fetch(`${this.options.janusUrl}/${sessionId}?rid=${new Date().getTime()}&maxev=1`).then(
      this.handleHttpErrors
    ).then(res => {
      return res.json()
    }).then(res => {
      this.onPublishStreamResult(res, name, sessionId, pluginId, peerId)
    }).catch(error => this.onError(`publish answer ${error}`))
  }

  /**
   * Janus callback for WebRTC stream is published
   * @param dataJson
   * @param name
   * @param sessionId
   * @param pluginId
   * @param peerId
   * @private
   */
  private onPublishStreamResult(dataJson: any, name: string, sessionId: string, pluginId: string, peerId: string) {
    console.log(`onPublishStreamResult: ${JSON.stringify(dataJson)}`)

    if (dataJson.jsep) {
      fetch(`${this.options.url}/api/setAnswer?peerid=${peerId}`, {
        method: 'POST',
        body: JSON.stringify(dataJson.jsep)
      }).then(
        this.handleHttpErrors
      ).then(res => {
        return res.json()
      }).then(response => {
        this.onSetAnswer(response, name, sessionId, pluginId, peerId)
      }).catch(error => this.onError(`setAnswer ${error}`))
    } else {
      this.emit(name, 'publishing failed (no SDP)')
    }
  }

  /**
   * WebRTC streamer callback for Answer
   * @param dataJson
   * @param name
   * @param sessionId
   * @param pluginId
   * @param peerId
   * @private
   */
  private onSetAnswer(dataJson: any, name: string, sessionId: string, pluginId: string, peerId: string) {
    console.log(`onSetAnswer: ${JSON.stringify(dataJson)}`)

    fetch(`${this.options.url}/api/getIceCandidate?peerid=${peerId}`).then(
      this.handleHttpErrors
    ).then(res => {
      return res.json()
    }).then(res => {
      this.onReceiveCandidate(res, name, sessionId, pluginId)
    }).catch(error => this.onError(`getIceCandidate ${error}`))
  }

  /**
   * WebRTC streamer callback for ICE candidate
   * @param dataJson
   * @param name
   * @param sessionId
   * @param pluginId
   */
  onReceiveCandidate(dataJson: any, name: string, sessionId: string, pluginId: string) {
    console.log(`onReceiveCandidate answer: ${JSON.stringify(dataJson)}`)

    for (let i = 0; i < dataJson.length; i++) {
      // send ICE candidate to Janus
      const candidateRequest = {
        janus: 'trickle',
        candidate: dataJson[i],
        transaction: Math.random().toString()
      }

      fetch(`${this.options.janusUrl}/${sessionId}/${pluginId}`, {
        method: 'POST',
        body: JSON.stringify(candidateRequest)
      }).then(
        this.handleHttpErrors
      ).then(res => {
        return res.json()
      }).then(res => {
        console.log(`onReceiveCandidate janus answer: ${JSON.stringify(res)}`)
      }).catch(error => this.onError(`setAnswer ${error}`))
    }

    // start long polling
    this.longPoll(null, name, sessionId)
  }

  /**
   * Janus callback for Long Polling
   * @param dataJson
   * @param name
   * @param sessionId
   * @private
   */
  private longPoll(dataJson: any, name: string, sessionId: string) {
    if (dataJson) {
      console.log(`poll evt: ${JSON.stringify(dataJson)}`)

      if (dataJson.janus === 'webrtcup') {
        // notify connection
        this.emit(name, 'up')

        // start keep alive
        setInterval(() => {
          this.keepAlive(sessionId)
        }, 10000)
      } else if (dataJson.janus === 'hangup') {
        // notify connection
        this.emit(name, 'down')
      } else if (dataJson.janus === 'event') {
        // member of the room
        const publishers = dataJson.plugindata.data.publishers
        if (publishers) {
          for (let i = 0; i < publishers.length; i++) {
            const publisher = publishers[i]
            this.emit(publisher.display, 'up')
          }
        }
      }
    }

    fetch(`${this.options.janusUrl}/${sessionId}?rid=${new Date().getTime()}&maxev=1`).then(
      this.handleHttpErrors
    ).then(res => {
      return res.json()
    }).then(res => {
      this.longPoll(res, name, sessionId)
    }).catch(error => this.onError(`long poll answer ${error}`))
  }

  /**
   * Janus callback for keepAlive Session
   * @param sessionId
   * @private
   */
  private keepAlive(sessionId: string) {
    const keepAliveReq = {
      janus: 'keepalive',
      session_id: sessionId,
      transaction: Math.random().toString()
    }

    fetch(`${this.options.janusUrl}/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(keepAliveReq)
    }).then(
      this.handleHttpErrors
    ).then(res => {
      return res.json()
    }).then(res => {
      console.log(`keepAlive answer: ${JSON.stringify(res)}`)
    }).catch(error => this.onError(`keepAlive ${error}`))
  }

  /**
   * Janus callback for Error
   * @param status
   * @private
   */
  private onError (status: any): void {
    console.log(`onError: ${status}`)
  }
}

export {
  JanusVideoRoom
}
