<p align="center">
  <a href="https://npmjs.com/package/webrtc-streamer-helper"><img src="https://badgen.net/npm/v/webrtc-streamer-helper" alt="npm package"></a>
  <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/webrtc-streamer-helper">
  <img alt="npm download week" src="https://img.shields.io/npm/dw/webrtc-streamer-helper">
  <img alt="GitHub" src="https://img.shields.io/github/license/zhensherlock/webrtc-streamer-helper">
</p>

# webrtc-streamer-helper

> This is a webrtc streamer helper.

## Installing

```bash
# or pnpm or yarn
npm install webrtc-streamer-helper
```

## Usage

```ts
import { WebRTCStreamer } from 'webrtc-streamer-helper'

const webRtcServer = new WebRTCStreamer({
  url: 'http://10.57.2.244:8000',
  element: '#div-1'
})

webRtcServer.connect(
  videoUrl,
  audioUrl,
  'rtptransport=tcp&timeout=60&width=320&height=0'
)
```

## Maintainers

[@zhensherlock](https://github.com/zhensherlock).

## Contributing

Feel free to dive in! [Open an issue](https://github.com/zhensherlock/webrtc-streamer-helper/issues/new/choose) or submit PRs.

Standard Readme follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

### Contributors

This project exists thanks to all the people who contribute.

<a href="https://github.com/zhensherlock/webrtc-streamer-helper/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=zhensherlock/webrtc-streamer-helper" />
</a>

## License

[MIT](LICENSE) © MichaelSun
