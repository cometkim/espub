import * as fs from 'node:fs/promises';

export type Manifest = {
  name?: string,

  type?: 'commonjs' | 'module',

  /**
   * Source file for the `main`, `module`, and `exports` entry
   */
  source?: string,

  // Non-standard entry style for legacy bundlers
  module?: string,

  // Main entry
  main?: string,

  // Binary entries
  bin?: string | {
    [name: string]: string,
  },

  // TypeScript declaration for "main" entry
  types?: string,

  // Export maps
  exports?: ConditionalExport,

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

// See https://nodejs.org/api/packages.html#packages_nested_conditions
// What a mess :/
export type ConditionalExport = (
  | string
  | {
    [module: string]: ConditionalExport,
  }
  | {
    'import'?: ConditionalExport,
    'require'?: ConditionalExport,
    'node'?: ConditionalExport,
    'node-addons'?: ConditionalExport,
    'default'?: ConditionalExport,

    // community conditions definitions
    // See https://nodejs.org/api/packages.html#packages_community_conditions_definitions
    // See also https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#package-json-exports-imports-and-self-referencing
    'types'?: ConditionalExport,
    'deno'?: ConditionalExport,
    'browser'?: ConditionalExport,
    'development'?: ConditionalExport,
    'production'?: ConditionalExport,
  }
);

type ManifestWithOverride = Manifest & {
  publishConfig?: Manifest,
};

interface LoadManifest {
  (props: {
    resolvePath: (path: string) => string,
  }): Promise<Manifest>;
}
export const loadManifest: LoadManifest = async ({ resolvePath }) => {
  const configPath = resolvePath('package.json');

  const { publishConfig, ...config } = await fs.readFile(configPath, 'utf-8')
    .then(JSON.parse) as ManifestWithOverride;

  return {
    ...config,
    ...publishConfig,
  };
}

