import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { NodeImportMaps } from './importMaps';

export type Config = {
  name?: string,

  type?: string,

  /**
   * Source file for the `main`, `module`, and `exports` entry
   */
  source?: string,

  main?: string,
  module?: string,

  // Main type declaration path
  types?: string,

  // Import maps
  imports?: Partial<NodeImportMaps>,

  // Export maps
  exports?: string | {
    [module: string]: string | {
      default?: string,
      node?: string,
      require?: string,
      import?: string,
    },
  },

  dependencies?: {
    [name: string]: string,
  },

  peerDependencies?: {
    [name: string]: string,
  },

  browserslist?: string | string[],

  engines?: {
    node?: string,
  },
};

type ConfigWithOverride = Config & {
  publishConfig?: Config,
};

type LoadConfigOptions = {
  basePath: string,
};

export async function loadConfig(options: LoadConfigOptions): Promise<Config> {
  const configPath = path.resolve(options.basePath, 'package.json');

  const { publishConfig, ...config } = await fs.readFile(configPath, 'utf-8')
    .then(JSON.parse) as ConfigWithOverride;

  return {
    ...config,
    ...publishConfig,
  };
}
