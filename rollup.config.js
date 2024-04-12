import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { babel } from '@rollup/plugin-babel';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import typescript from '@rollup/plugin-typescript';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import commonjs from '@rollup/plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';

import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const extensions = ['.ts', '.tsx'];

// eslint-disable-next-line no-undef
const isDev = process.env.ROLLUP_WATCH === 'true';
// const isDev = false;

let serveDevDemoPages = [];

if (isDev) {
  serveDevDemoPages = [
    serve({
      open: true,
      verbose: true,
      contentBase: ['dist', 'demo'],
      host: 'localhost',
      port: 5678,
    }),
    livereload({ watch: 'dist' }),
  ];
}

const indexConfig = {
  plugins: [
    resolve({ extensions, browser: true }),
    commonjs(),
    uglify(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: ['solid', '@babel/preset-typescript'],
      extensions,
    }),
    postcss({
      plugins: [autoprefixer(), tailwindcss()],
      extract: false,
      modules: false,
      autoModules: false,
      minimize: true,
      inject: false,
    }),
    typescript(),
    typescriptPaths({ preserveExtensions: true }),
    terser({ output: { comments: false } }),
    ...(isDev ? serveDevDemoPages : []),
  ],
};

const configs = defineConfig([
  {
    ...indexConfig,
    input: './src/web.ts',
    output: {
      file: 'dist/web.js',
      format: 'es',
    },
  },
]);

export default configs;
