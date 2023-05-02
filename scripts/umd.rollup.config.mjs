/**
 * Rollup configuration for packaging the plugin in a module that is consumable
 * as the `src` of a `script` tag or via AMD or similar client-side loading.
 *
 * This module DOES include its dependencies.
 */
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';

export default {
  name: 'videojsQualitySelector',
  input: 'src/js/index.js',
  output: {
    name: 'videojs-quality-selector',
    file: 'dist/videojs-quality-selector.js',
    format: 'umd',
    globals: {
      'video.js': 'videojs',
      'global': 'window',
      'global/window': 'window',
      'global/document': 'document'
    }
  },
  external: [
    'global',
    'global/window',
    'global/document',
    'video.js'
  ],
  plugins: [
    resolve({
      browser: true,
      main: true,
      jsnext: true
    }),
    json(),
    commonjs({
      sourceMap: false
    }),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.es6', '.es', '.mjs', 'ts', 'tsx'],
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          targets: {
            chrome: 104
          }
        }]
      ]
    })
  ]
};
