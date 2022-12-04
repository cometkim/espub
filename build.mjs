import esbuild from 'esbuild';
import manifest from './package.json' assert { type: 'json' };

esbuild.build({
  entryPoints: ['src/bin.ts'],
  outfile: 'bin.min.mjs',
  bundle: true,
  write: true,
  treeShaking: true,
  sourcemap: false,
  minify: true,
  format: 'esm',
  platform: 'node',
  target: ['node16'],
  external: Object.keys(manifest.dependencies),
});