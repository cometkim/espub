import * as path from 'node:path';
import dedent from 'string-dedent';
import { type TSConfig } from 'pkg-types';
import * as semver from 'semver';

import { type Flags } from './cli';
import { type Manifest } from './manifest';
import { type Entry } from './entry';
import { type Reporter } from './reporter';
import { type PathResolver, type RelativePathResolver } from './common';
import * as formatUtils from './formatUtils';
import { NanobundleError } from './errors';

export class NanobundleConfigError extends NanobundleError {
  name = 'NanobundleConfigError';
}

export type Context = {
  cwd: string,
  verbose: boolean,
  module: Entry['module'],
  platform: Entry['platform'],
  sourcemap: boolean,
  bundle: boolean,
  declaration: boolean,
  jsx: 'transform' | 'preserve' | 'automatic' | undefined,
  jsxDev: boolean,
  jsxFactory: string,
  jsxFragment: string,
  jsxImportSource: string,
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
  resolvePath: PathResolver,
  resolveRelativePath: RelativePathResolver,
};

export type Config = {
  flags: Flags,
  manifest: Manifest,
  targets: string[],
  reporter: Reporter,
  tsconfig?: TSConfig,
  tsconfigPath?: string,
};

export function parseConfig({
  flags,
  manifest,
  targets: inputTargets,
  reporter,
  tsconfig,
  tsconfigPath: resolvedTsConfigPath,
}: Config): Context {
  const cwd = path.resolve(flags.cwd);
  const resolvePath: PathResolver = (...paths: string[]) => path.resolve(cwd, ...paths);
  const resolveRelativePath: RelativePathResolver = (targetPath: string, startsWithDot = false) => {
    const relativePath = path.relative(cwd, targetPath);
    if (startsWithDot) return `./${relativePath}`;
    return relativePath;
  }
  const bundle = flags.bundle;
  const verbose = flags.verbose;
  const standalone = flags.standalone;
  const tsconfigPath = resolvedTsConfigPath;
  const importMapsPath = path.resolve(cwd, flags.importMaps);
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

  let sourcemap: Context['sourcemap'] = true;
  if (tsconfig?.compilerOptions?.sourceMap != null) {
    sourcemap = tsconfig.compilerOptions.sourceMap;
  }
  if (flags.sourcemap === false) {
    sourcemap = false;
  }

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

  let jsx: Context['jsx'] = undefined;
  if (tsconfig?.compilerOptions?.jsx === 'preserve') {
    jsx = 'preserve';
  }
  if (['react', 'react-native'].includes(tsconfig?.compilerOptions?.jsx)) {
    jsx = 'transform';
  }
  if (['react-jsx', 'react-jsxdev'].includes(tsconfig?.compilerOptions?.jsx)) {
    jsx = 'automatic';
  }
  if (flags.jsx === 'preserve') {
    jsx = 'preserve';
  }
  if (flags.jsx === 'transform') {
    jsx = 'transform';
  }
  if (flags.jsx === 'automatic') {
    jsx = 'automatic';
  }

  let jsxDev = false;
  if (!flags.jsx && tsconfig?.compilerOptions?.jsx === 'react-jsxdev') {
    jsxDev = true;
  }

  const jsxFactory: Context['jsxFactory'] = (
    flags.jsxFactory ||
    tsconfig?.compilerOptions?.jsxFactory ||
    'React.createElement'
  );

  const jsxFragment: Context['jsxFactory'] = (
    flags.jsxFragment ||
    tsconfig?.compilerOptions?.jsxFragmentFactory ||
    'Fragment'
  );

  const jsxImportSource: Context['jsxImportSource'] = (
    flags.jsxImportSource ||
    tsconfig?.compilerOptions?.jsxImportSource ||
    'react'
  );

  return {
    cwd,
    verbose,
    module,
    platform,
    sourcemap,
    bundle,
    declaration,
    jsx,
    jsxDev,
    jsxFactory,
    jsxFragment,
    jsxImportSource,
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
    resolvePath,
    resolveRelativePath,
  };
};
