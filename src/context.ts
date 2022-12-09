import * as path from 'node:path';
import dedent from 'string-dedent';
import { type TSConfig } from 'pkg-types';
import * as semver from 'semver';

import { type Flags } from './cli';
import { type Manifest } from './manifest';
import { type Entry } from './entry';
import { type Reporter } from './reporter';
import { type PathResolver } from './common';
import * as formatUtils from './formatUtils';
import { NanobundleError } from './errors';

export class NanobundleConfigError extends NanobundleError {
  name = 'NanobundleConfigError';
}

export type Context = {
  cwd: string,
  module: Entry['module'],
  platform: Entry['platform'],
  sourcemap: boolean,
  declaration: boolean,
  jsx: 'preserve' | 'automatic' | null,
  jsxDev: boolean,
  standalone: boolean,
  rootDir: string,
  outDir: string,
  tsconfigPath?: string,
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
  const cwd = path.resolve(flags.cwd);
  const sourcemap = !flags.noSourcemap;
  const standalone = flags.standalone;
  const tsconfigPath = resolvedTsConfigPath;
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

  let targets = [...inputTargets];
  if (manifest.engines?.node) {
    const version = semver.minVersion(manifest.engines.node);
    if (version) {
      targets = [...targets, `node${version.major}`];
    }
  }
  if (platform === 'node' && !targets.some(target => target.startsWith('node'))) {
    targets = [...targets, 'node14'];
  }
  if (platform === 'node') {
    targets = targets.filter(target => target.startsWith('node'));
  }
  if (platform === 'browser') {
    targets = targets.filter(target => !target.startsWith('node'));
  }

  let declaration = false;
  if (flags.dts && tsconfig) {
    declaration = tsconfig.compilerOptions?.declaration !== false;
  }

  if (!declaration && rootDir === outDir) {
    throw new NanobundleConfigError(dedent`
      ${formatUtils.key('rootDir')} (${formatUtils.path(rootDir)}) and ${formatUtils.key('outDir')} (${formatUtils.path(outDir)}) are conflict!

      Please specify different directory for one of them.
    `,)
  }

  let jsx: Context['jsx'] = null;
  if (['preserve', 'react', 'react-native'].includes(tsconfig?.compilerOptions?.jsx)) {
    jsx = 'preserve';
  }
  if (['react-jsx', 'react-jsxdev'].includes(tsconfig?.compilerOptions?.jsx)) {
    jsx = 'automatic';
  }
  if (flags.jsx === 'preserve') {
    jsx = 'preserve';
  }
  if (flags.jsx === 'automatic') {
    jsx = 'automatic';
  }

  let jsxDev = false;
  if (!flags.jsx && tsconfig?.compilerOptions?.jsx === 'react-jsxdev') {
    jsxDev = true;
  }

  return {
    cwd,
    module,
    platform,
    sourcemap,
    declaration,
    jsx,
    jsxDev,
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
