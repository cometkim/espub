import * as path from 'path';
import * as fs from 'fs/promises';

export type Config = {
  source?: string,

  main?: string,
  module?: string,
  types?: string,

  imports?: {
    [module: string]: string | {
      default?: string,
      node?: string,
    },
  },

  exports?: string | {
    [module: string]: string | {
      default?: string,
      node?: string,
      require?: string,
      import?: string,
    },
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
