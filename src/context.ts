import dedent from 'string-dedent';
import { type TSConfig } from 'pkg-types';
import * as semver from 'semver';

import { type Flags } from './cli';
import { type Manifest } from './manifest';
import { type Entry } from './entry';
import { type Reporter } from './reporter';
import { type PathResolver } from './common';
import * as formatUtils from './formatUtils';

export class NanobundleConfigError extends Error {
  name = 'NanobundleConfigError';
}

export type Context = {
  cwd: string,
  module: Entry['module'],
  platform: Entry['platform'],
  sourcemap: boolean,
  declaration: boolean,
  standalone: boolean,
  rootDir: string,
  outDir: string,
  tsconfigPath: string,
  importMapsPath: string,
  externalDependencies: string[],
  forceExternalDependencies: string[],
  manifest: Manifest,
  targets: string[],
  reporter: Reporter,
  resolve: PathResolver,
};

export type Config = {
  flags: Flags,
  manifest: Manifest,
  targets: string[],
  reporter: Reporter,
  resolve: PathResolver,
  tsconfig?: TSConfig,
  tsconfigPath?: string,
};

export function parseConfig({
  flags,
  manifest,
  targets: inputTargets,
  reporter,
  resolve,
  tsconfig,
  tsconfigPath: resolvedTsConfigPath,
}: Config): Context {
  const cwd = flags.cwd;
  const sourcemap = !flags.noSourcemap;
  const standalone = flags.standalone;
  const tsconfigPath = resolvedTsConfigPath || flags.tsconfig;
  const importMapsPath = flags.importMaps;
  const forceExternalDependencies = flags.external;
  const externalDependencies = [
    ...(manifest.dependencies ? Object.keys(manifest.dependencies) : []),
    ...(manifest.peerDependencies ? Object.keys(manifest.peerDependencies) : []),
    ...forceExternalDependencies,
  ];

  const rootDir: string = (
    flags.rootDir ||
    tsconfig?.compilerOptions?.rootDir ||
    'src'
  );
  const outDir: string = (
    flags.outDir ||
    tsconfig?.compilerOptions?.outDir ||
    'lib'
  );

  const module = (
    manifest.type === 'module'
      ? 'esmodule'
      : 'commonjs'
  );

  let platform: Entry['platform'] = 'neutral';
  if (['node', 'deno', 'web'].includes(flags.platform || '')) {
    platform = flags.platform as Entry['platform'];
  } else if (manifest.engines?.node) {
    platform = 'node';
  }

  const targets = [...inputTargets];
  if (manifest.engines?.node) {
    const version = semver.minVersion(manifest.engines.node);
    if (version) {
      targets.push(`node${version.major}`);
    }
  }
  if (platform === 'node' && !targets.some(target => target.startsWith('node'))) {
    targets.push('node14');
  }

  let declaration = false;
  if (!flags.noDts && tsconfig) {
    declaration = tsconfig.compilerOptions?.declaration !== false;
  }

  if (!declaration && rootDir === outDir) {
    throw new NanobundleConfigError(dedent`
      ${formatUtils.key('rootDir')} (${formatUtils.path(rootDir)}) and ${formatUtils.key('outDir')} (${formatUtils.path(outDir)}) are conflict!

      Please specify different directory for one of them.
    `,)
  }

  return {
    cwd,
    module,
    platform,
    sourcemap,
    declaration,
    standalone,
    rootDir,
    outDir,
    tsconfigPath,
    importMapsPath,
    externalDependencies,
    forceExternalDependencies,
    manifest,
    targets,
    reporter,
    resolve,
  };
};
