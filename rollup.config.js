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
    name: 'WebrtcStreamerHelper',
    format: 'esm',
    file: 'dist/index.esm.js',
    sourcemap: true
  },
  {
    name: 'WebrtcStreamerHelper',
    format: 'umd',
    file: 'dist/index.umd.js',
    sourcemap: true
  },
  {
    name: 'WebrtcStreamerHelper',
    format: 'iife',
    file: 'dist/index.iife.js',
    sourcemap: true
  },
  {
    name: 'WebrtcStreamerHelper',
    format: 'cjs',
    file: 'dist/index.cjs.js',
    sourcemap: true
  },
  // min
  {
    name: 'WebrtcStreamerHelper',
    format: 'esm',
    file: 'dist/index.esm.min.js',
    plugins: [terser()]
  },
  {
    name: 'WebrtcStreamerHelper',
    format: 'umd',
    file: 'dist/index.umd.min.js',
    plugins: [terser()]
  },
  {
    name: 'WebrtcStreamerHelper',
    format: 'iife',
    file: 'dist/index.iife.min.js',
    plugins: [terser()]
  },
  {
    name: 'WebrtcStreamerHelper',
    format: 'cjs',
    file: 'dist/index.cjs.min.js',
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
