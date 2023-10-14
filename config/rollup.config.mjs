import commonJS from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import tsConfig from '../tsconfig.json' assert { type: 'json' };
import packageJson from '../package.json' assert { type: 'json' };

const external = Object.keys(packageJson.peerDependencies || {});

const config = {
  input: 'src/index.ts',
  external,
  output: [
    {
      format: 'es',
      file: packageJson.exports['.'].browser,
      sourcemap: true
    }
  ],
  treeshake: {
    preset: 'smallest'
  }
};

export default [
  // esm browser
  {
    ...config,
    plugins: [
      typescript({
        compilerOptions: {
          ...tsConfig.compilerOptions
        }
      }),
      commonJS(),
      nodeResolve({
        browser: true
      }),
      terser()
    ]
  },
  // umd browser
  {
    ...config,
    external: [],
    plugins: [
      typescript({
        compilerOptions: {
          ...tsConfig.compilerOptions
        }
      }),
      commonJS(),
      nodeResolve({
        browser: true
      }),
      terser()
    ],
    output: [
      {
        format: 'iife',
        file: packageJson.exports['.'].umd,
        name: 'Iden3Core',
        sourcemap: true
      }
    ]
  }
];
