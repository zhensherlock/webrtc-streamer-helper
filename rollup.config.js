import filesize from 'rollup-plugin-filesize'
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import strip from '@rollup/plugin-strip'
import eslint from '@rollup/plugin-eslint'
import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'
// import sass from 'rollup-plugin-sass'

const output = [
  {
    format: 'esm',
    file: 'dist/webrtc-streamer-helper.esm.js'
  },
  {
    format: 'umd',
    name: 'webrtc-streamer-helper',
    file: 'dist/webrtc-streamer-helper.umd.js'
  },
  {
    format: 'iife',
    file: 'dist/webrtc-streamer-helper.browser.js'
  },
  {
    format: 'esm',
    file: 'dist/webrtc-streamer-helper.esm.min.js',
    plugins: [terser()]
  },
  {
    format: 'umd',
    name: 'webrtc-streamer-helper',
    file: 'dist/webrtc-streamer-helper.umd.min.js',
    plugins: [terser()]
  },
  {
    format: 'iife',
    file: 'dist/webrtc-streamer-helper.browser.min.js',
    plugins: [terser()]
  }
]

export default [
  {
    input: 'src/main.ts',
    output,
    plugins: [
      eslint({
        throwOnError: true,
        throwOnWarning: true,
        include: ['src/**'],
        exclude: ['node_modules/**', 'src/style/**']
      }),
      resolve(),
      strip(),
      typescript(),
      postcss({
        plugins: [
          autoprefixer(),
          cssnano()
        ]
      }),
      // sass({
      //   insert: true
      // }),
      babel({ babelHelpers: 'runtime', exclude: ['node_modules/**'] }),
      filesize()
    ]
  }
]
