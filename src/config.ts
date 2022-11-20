import type { CompilerOptions as TSCompilerOptions } from "typescript";
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
  manifest: Manifest,
};

export type Config = {
  flags: Flags,
  manifest: Manifest,
  tsCompilerOptions?: TSCompilerOptions,
};

interface ParseConfig {
  (config: Config): ParsedConfig;
}
export const parseConfig: ParseConfig = ({
  flags,
  manifest,
  tsCompilerOptions,
}) => {
  const cwd = flags.cwd;

  const rootDir = (
    flags.rootDir ||
    tsCompilerOptions?.rootDir ||
    'src'
  );
  const outDir = (
    flags.outDir ||
    tsCompilerOptions?.outDir ||
    'lib'
  );
  if (rootDir === outDir) {
    throw new NanobundleConfigError(`Directory rootDir(${rootDir}) and outDir(${outDir}) are conflict! Please specify different directory for one of them.`)
  }

  const module = manifest.type === 'module'
    ? 'esmodule'
    : 'commonjs';

  const sourcemap = !flags.noSourcemap;

  let platform: Entry['platform'] = 'netural';
  if (['node', 'deno', 'web'].includes(flags.platform || '')) {
    platform = flags.platform as Entry['platform'];
  } else if (manifest.engines?.node) {
    platform = 'node';
  }

  let declaration = false;
  if (tsCompilerOptions) {
    declaration = (
      (!flags.noDts) &&
      (tsCompilerOptions.declaration === true)
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
    manifest,
  };
};
