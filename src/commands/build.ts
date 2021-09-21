import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
import type { BuildOptions, Plugin } from 'esbuild';
import * as esbuild from 'esbuild';
import prettyBytes from 'pretty-bytes';

import type { Entry } from '../entry';
import type { Reporter } from '../report';
import { formatModule } from '../utils';
import { makePlugin as makeImportMapsPlugin } from '../plugins/esbuildImportMapsPlugin';

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

type BuildCommandOptions = {
  reporter: Reporter,
  sourceFile: string,
  entries: Entry[],
  targets: string[],
  externalDependencies: string[],
  minify: boolean,
  sourcemap: boolean,
  tsconfig?: string,
  plugins?: Plugin[],
  imports?: {
    web?: Record<string, string>,
    node?: Record<string, string>,
  },
};

export async function buildCommand({
  reporter,
  sourceFile,
  entries,
  targets,
  externalDependencies,
  minify,
  sourcemap,
  plugins,
  tsconfig,
  imports = {},
}: BuildCommandOptions): Promise<number> {
  const defaultBuildOptions: BuildOptions = {
    bundle: true,
    write: false,
    entryPoints: [sourceFile],
    external: externalDependencies,
    define: {
      'process.env.NODE_ENV': 'production',
    },
    tsconfig,
    plugins,
    minify,
    sourcemap: sourcemap ? 'external' : undefined,
  };
  const webImportMaps = imports.web && makeImportMapsPlugin('web', imports.web);
  const nodeImportMaps = imports.node && makeImportMapsPlugin('node', imports.node);

  const build = entries.map(async entry => {
    const outfile = entry.outputFile;
    const format = entry.module === 'commonjs' ? 'cjs' : 'esm';
    if (entry.platform === 'node') {
      const nodeTargets = targets
        .filter(target => target.startsWith('node'));
      if (nodeTargets.length === 0) {
        nodeTargets.push('node14');
      }
      const nodePlugins = [nodeImportMaps]
        .filter(Boolean) as Plugin[];
      return [entry, await esbuild.build({
        ...defaultBuildOptions,
        outfile,
        format,
        platform: 'node',
        target: nodeTargets,
        plugins: nodePlugins,
      })] as const;

    } else {
      const webTargets = targets
        .filter(target => !target.startsWith('node'));
      const webPlugins = [webImportMaps]
        .filter(Boolean) as Plugin[];
      return [entry, await esbuild.build({
        ...defaultBuildOptions,
        outfile,
        format,
        platform: 'neutral',
        target: webTargets,
        plugins: webPlugins,
      })] as const;
    }
  });

  try {
    const results = await Promise.all(build);
    reporter.info('📦 Build info:');

    for (const [entry, result] of results) {
      for (const error of result.errors) {
        reporter.error(error.text);
      }
      if (result.errors.length > 0) {
        reporter.error('Failed to build.');
        return 1;
      }

      for (const warning of result.warnings) {
        reporter.warn(warning.text);
      }

      for (const outputFile of result.outputFiles || []) {
        const dirname = path.dirname(outputFile.path);
        await fs.mkdir(dirname, { recursive: true });

        await fs.writeFile(outputFile.path, outputFile.contents, 'utf8');

        if (!outputFile.path.endsWith('.map')) {
          const [
            gzipped,
            brotlied,
          ] = await Promise.all([
            gzip(outputFile.contents),
            brotli(outputFile.contents),
          ]);
          reporter.info(`
  ${formatModule(entry.module)} entry ${entry.path}${entry.platform === 'node' ? ' for Node.js' : ''}
    size      : ${prettyBytes(outputFile.contents.length)}
    size (gz) : ${prettyBytes(gzipped.byteLength)}
    size (br) : ${prettyBytes(brotlied.byteLength)}`);
        }
      }
    }
  } catch (error) {
    reporter.error(error);
    return 1;
  }

  return 0;
}
