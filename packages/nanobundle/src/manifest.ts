import * as path from 'node:path';
import * as fs from 'node:fs/promises';

export type Manifest = {
  name?: string,

  version?: string,

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
  exports?: ConditionalExports,

  // Subpath imports
  imports?: ConditionalImports,

  dependencies?: {
    [name: string]: string,
  },

  peerDependencies?: {
    [name: string]: string,
  },

  browserslist?: string | string[],

  engines?: {
    node?: string,
    deno?: string,
  },
};

// See https://nodejs.org/api/packages.html#packages_nested_conditions
// What a mess :/
export type ConditionalExports = (
  | string
  | {
    [module: string]: ConditionalExports,
  }
  | {
    'import'?: ConditionalExports,
    'require'?: ConditionalExports,
    'node'?: ConditionalExports,
    'node-addons'?: ConditionalExports,
    'default'?: ConditionalExports,

    // community conditions definitions
    // See https://nodejs.org/api/packages.html#packages_community_conditions_definitions
    // See also https://devblogs.microsoft.com/typescript/announcing-typescript-4-7/#package-json-exports-imports-and-self-referencing
    'types'?: ConditionalExports,
    'deno'?: ConditionalExports,
    'browser'?: ConditionalExports,
    'development'?: ConditionalExports,
    'production'?: ConditionalExports,
  }
);

export type ConditionalImports = (
  | string
  | {
    [module: string]: ConditionalImports,
  }
  | {
    'import'?: ConditionalImports,
    'require'?: ConditionalImports,
    'node'?: ConditionalImports,
    'default'?: ConditionalImports,
    'browser'?: ConditionalImports,
    'development'?: ConditionalImports,
    'production'?: ConditionalImports,
  }
);

type ManifestWithOverride = Manifest & {
  publishConfig?: Manifest,
};

interface LoadManifest {
  (props: {
    basePath: string,
  }): Promise<Manifest>;
}
export const loadManifest: LoadManifest = async ({
  basePath,
}) => {
  const configPath = path.resolve(basePath, 'package.json');

  const { publishConfig, ...config } = await fs.readFile(configPath, 'utf-8')
    .then(JSON.parse) as ManifestWithOverride;

  return {
    ...config,
    ...publishConfig,
  };
}
