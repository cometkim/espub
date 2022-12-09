import * as fs from 'fs/promises';

import { type Context } from '../../context';
import * as fsUtils from '../../fsUtils';
import { type ConditionalImports } from '../../manifest';

import { type BundleOptions } from './entryGroup';

export type NodeImportMaps = {
  imports: Exclude<ConditionalImports, string>,
};
export type ValidNodeImportMaps = NodeImportMaps & { __BRAND__: 'ValidNodeImportMaps' };
export type ImportMaps = {
  imports: Record<string, string>,
};

export async function loadImportMaps(context: Context): Promise<NodeImportMaps> {
  const importMapsPath = context.resolve(context.cwd, context.importMapsPath);
  const { imports = {} } = await fs.readFile(importMapsPath, 'utf-8')
    .then(JSON.parse) as Partial<NodeImportMaps>;
  return { imports };
}

type ValidateNodeImportMapsOptions = {
  context: Context,
  importMaps: NodeImportMaps,
}
export async function validateImportMaps({
  context,
  importMaps,
}: ValidateNodeImportMapsOptions): Promise<ValidNodeImportMaps> {
  for (const path of Object.values(importMaps.imports)) {
    if (typeof path === 'object') {
      await validateImportMaps({
        context,
        importMaps: {
          imports: path,
        },
      });
    } else {
      if (!fsUtils.isFileSystemReference(path)) {
        // Loosen validation if path doesn't seems to be a file system reference
        // Instead, expecting it can be resolved as a Node.js module later
        continue;
      }
      const resolvedPath = context.resolve(context.cwd, path);
      const exist = await fsUtils.exists(resolvedPath);
      if (!exist) {
        throw new Error(`${resolvedPath} doesn't exist`);
      }
    }
  }
  return importMaps as ValidNodeImportMaps;
}

export function normalizeImportMaps(
  importMaps: ValidNodeImportMaps,
  bundleOptions: BundleOptions,
): ImportMaps {
  function normalize(
    rootKey: string,
    imports: ConditionalImports,
    mode: BundleOptions['mode'],
    module: BundleOptions['module'],
    platform: BundleOptions['platform'],
  ): string {
    if (typeof imports === 'string') {
      return imports;

    } else {
      for (const [key, value] of Object.entries(imports)) {
        if (key === 'node' && platform === 'node') {
          if (typeof value === 'string') {
            return value;
          } else {
            return normalize(
              rootKey,
              value,
              mode,
              module,
              'node',
            );
          }
        }
        if (key === 'browser' && platform === 'browser') {
          if (typeof value === 'string') {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode,
              module,
              'browser',
            );
          }
        }
        if (key === 'require' && module === 'commonjs') {
          if (typeof value === 'string') {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode,
              'commonjs',
              platform,
            );
          }
        }
        if (key === 'import' && module === 'esmodule') {
          if (typeof value === 'string') {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode,
              'esmodule',
              platform,
            );
          }
        }
        if (key === 'development' && mode === 'development') {
          if (typeof value === 'string') {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              'development',
              module,
              platform,
            );
          }
        }
        if (key === 'production' && mode === 'production') {
          if (typeof value === 'string') {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              'production',
              module,
              platform,
            );
          }
        }
        if (key === 'default') {
          if (typeof value === 'string') {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode,
              module,
              platform,
            );
          }
        }
        continue;
      }
      return rootKey;
    }
  }

  const { mode, module, platform } = bundleOptions;
  const result: ImportMaps = {
    imports: {},
  };
  for (const [key, imports] of Object.entries(importMaps.imports)) {
    result.imports[key] = normalize(
      key,
      imports,
      mode,
      module,
      platform,
    );
  }

  return result;
}
