import * as fs from 'node:fs/promises';

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
  resolvePath: (path: string) => string,
};

export async function loadConfig({ resolvePath }: LoadConfigOptions): Promise<Config> {
  const configPath = resolvePath('package.json');

  const { publishConfig, ...config } = await fs.readFile(configPath, 'utf-8')
    .then(JSON.parse) as ConfigWithOverride;

  return {
    ...config,
    ...publishConfig,
  };
}
