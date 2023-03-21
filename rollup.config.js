import typescript from '@rollup/plugin-typescript'
import strip from '@rollup/plugin-strip'
import eslint from '@rollup/plugin-eslint'

export default [
  {
    input: 'src/main.ts',
    output: [
      {
        file: 'dist/webrtc-streamer-helper.esm.js',
        format: 'esm'
      }
    ],
    plugins: [
      eslint({
        throwOnError: true,
        throwOnWarning: true,
        include: ['src/**'],
        exclude: ['node_modules/**']
      }),
      strip(),
      typescript()
    ]
  }
]
