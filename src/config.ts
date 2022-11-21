import type { TSConfig } from 'pkg-types';
import type { Flags } from "./cli";
import type { Manifest } from "./manifest";
import type { Entry } from "./entry";

export class NanobundleConfigError extends Error {
  name = 'NanobundleConfigError';
}

export type ParsedConfig = {
  cwd: string,
  module: Entry['module'],
  platform: Entry['platform'],
  sourcemap: boolean,
  declaration: boolean,
  rootDir: string,
  outDir: string,
  tsconfigPath: string,
  manifest: Manifest,
};

export type Config = {
  flags: Flags,
  manifest: Manifest,
  tsconfig?: TSConfig,
  tsconfigPath?: string,
};

interface ParseConfig {
  (config: Config): ParsedConfig;
}
export const parseConfig: ParseConfig = ({
  flags,
  manifest,
  tsconfig,
  tsconfigPath: resolvedTsConfigPath,
}) => {
  const cwd = flags.cwd;
  const sourcemap = !flags.noSourcemap;
  const tsconfigPath = resolvedTsConfigPath || flags.tsconfig;

  const rootDir = (
    flags.rootDir ||
    tsconfig?.compilerOptions?.rootDir ||
    'src'
  );
  const outDir = (
    flags.outDir ||
    tsconfig?.compilerOptions?.outDir ||
    'lib'
  );
  if (rootDir === outDir) {
    throw new NanobundleConfigError(`Directory rootDir(${rootDir}) and outDir(${outDir}) are conflict! Please specify different directory for one of them.`)
  }

  const module = (
    manifest.type === 'module'
      ? 'esmodule'
      : 'commonjs'
  );

  let platform: Entry['platform'] = 'netural';
  if (['node', 'deno', 'web'].includes(flags.platform || '')) {
    platform = flags.platform as Entry['platform'];
  } else if (manifest.engines?.node) {
    platform = 'node';
  }

  let declaration = false;
  if (tsconfig?.compilerOptions) {
    declaration = (
      (!flags.noDts) &&
      (tsconfig.compilerOptions.declaration === true)
    );
  }

  return {
    cwd,
    module,
    platform,
    sourcemap,
    declaration,
    rootDir,
    outDir,
    tsconfigPath,
    manifest,
  };
};
