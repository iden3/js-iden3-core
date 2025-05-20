import commonJS from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import tsConfig from '../tsconfig.json' with { type: 'json' };
import packageJson from '../package.json' with { type: 'json' };

const external = Object.keys(packageJson.peerDependencies || {});
const compilerOptions = {
  ...tsConfig.compilerOptions,
  outDir: undefined,
  declarationDir: undefined,
  declaration: undefined,
  sourceMap: undefined,
  declarationMap: undefined,
};

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
        compilerOptions
      }),
      commonJS(),
      nodeResolve({
        browser: true
      }),
    ]
  },
  // umd browser
  {
    ...config,
    external: [],
    plugins: [
      typescript({
        compilerOptions
      }),
      commonJS(),
      nodeResolve({
        browser: true
      })
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
