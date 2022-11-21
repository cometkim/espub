import * as path from 'node:path';
import type {
  Format,
  BuildOptions as EsbuildOptions,
} from 'esbuild';

import type { PathResolver } from './common';
import type { ParsedConfig } from './config';
import type { Entry } from './entry';
import type { EntryGroup } from './entryGroup';
import type { Reporter } from './report';

import * as fsUtils from './fsUtils';
import { optionsFromHash } from './entryGroup';

interface BuildOptions extends EsbuildOptions {
  bundle: boolean,
  write: boolean,
  define: Record<string, string>,
  tsconfig: string,
  minify: boolean,
  sourcemap: boolean,
  format: Format,
  target: string[],
  outdir: string,
  entryPoints: Record<string, string>,

  nanobundlePlatform: Entry['platform'],
}

interface MakeBuildOptions {
  (props: {
    resolvePath: PathResolver;
    reporter: Reporter,
    config: ParsedConfig,
    entryGroup: EntryGroup,
    targets: string[],
  }): Promise<BuildOptions[]>;
}
export const makeBuildOptions: MakeBuildOptions = async ({
  resolvePath,
  reporter,
  config,
  entryGroup,
  targets,
}) => {
  const buildOptions: BuildOptions[] = [];

  for (const [optionsHash, groupEntries] of Object.entries(entryGroup)) {
    const options = optionsFromHash(optionsHash);

    const entries = await Promise.all(
      groupEntries
        .map(entry => ensureSourceFile({ entry, config, resolvePath })),
    );
    const entryPoints = Object.fromEntries(entries);

    const target = [...targets];
    if (options.platform === 'node' && !target.some(target => target.startsWith('node'))) {
      target.push('node14');
    }

    const buildOption: BuildOptions = {
      bundle: true,
      write: false,
      target,
      entryPoints,
      outdir: resolvePath(
        config.cwd,
        config.outDir
      ),
      format: (
        // It should not be file or json module.
        options.module === 'esmodule'
          ? 'esm'
          : 'cjs'
      ),
      minify: options.minify,
      sourcemap: options.sourcemap,
      define: {},
      ...options.mode === 'development' && {
        define: {
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
      },
      ...options.mode === 'production' && {
        define: {
          'process.env.NODE_ENV': JSON.stringify('production'),
        },
      },
      tsconfig: (
        path.isAbsolute(config.tsconfigPath)
          ? config.tsconfigPath
          : resolvePath(config.cwd, config.tsconfigPath)
      ),

      nanobundlePlatform: options.platform,
    };
    buildOptions.push(buildOption);
  }

  return buildOptions;
};

interface EnsureSourceFile {
  (props: {
    entry: Entry,
    config: ParsedConfig,
    resolvePath: PathResolver,
  }): Promise<[string, string]>;
}
const ensureSourceFile: EnsureSourceFile = async ({
  entry,
  config,
  resolvePath,
}) => {
  let sourceFile;
  for (const candidate of entry.sourceFile) {
    const path = resolvePath(config.cwd, candidate);
    if (await fsUtils.exists(path)) {
      sourceFile = path;
    }
  }

  if (!sourceFile) {
    throw new Error(`Couldn't resolve source file for entry \`${entry.key}\``);
  }

  return [entry.outputFile, sourceFile];
}