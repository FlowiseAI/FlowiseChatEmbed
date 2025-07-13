import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { babel } from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import typescript from '@rollup/plugin-typescript';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import commonjs from '@rollup/plugin-commonjs';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const isDev = process.env.NODE_ENV === 'development';
const isDebug = process.env.NODE_ENV === 'debug';

const extensions = ['.ts', '.tsx'];

const indexConfig = {
  context: 'this',
  plugins: [
    resolve({ extensions, browser: true }),
    commonjs(),
    json(),
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
      minimize: !isDebug,
      inject: false,
    }),
    typescript({
      sourceMap: isDebug,
      inlineSources: isDebug,
    }),
    typescriptPaths({ preserveExtensions: true }),
    // Only use terser in production mode, skip in debug mode
    ...(isDebug ? [] : [terser({ output: { comments: false } })]),
    ...(isDev || isDebug
      ? [
          serve({
            open: true,
            verbose: true,
            contentBase: ['.', 'dist', 'public'],
            host: 'localhost',
            port: 51914,
          }),
          livereload({ watch: 'dist' }),
        ]
      : []), // Add serve/livereload in development and debug modes
  ],
};

const configs = [
  {
    ...indexConfig,
    input: './src/web.ts',
    output: {
      file: 'dist/web.js',
      format: 'es',
      sourcemap: isDebug,
    },
  },
  {
    ...indexConfig,
    input: './src/web.ts',
    output: {
      file: 'dist/web.umd.js',
      format: 'umd',
      name: 'FlowiseEmbed',
      sourcemap: isDebug,
    },
  },
];

export default configs;
