import { babel } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';

export default {
  name: 'videojsQualitySelector',
  input: 'src/js/index.js',
  output: [{
    file: 'dist/videojs-quality-selector.cjs.js',
    format: 'cjs',
    globals: {
      'video.js': 'videojs'
    }
  }, {
    file: 'dist/videojs-quality-selector.es.js',
    format: 'es',
    globals: {
      'video.js': 'videojs'
    }
  }],
  external: [
    'global',
    'global/document',
    'global/window',
    'video.js'
  ],
  plugins: [
    json(),
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
