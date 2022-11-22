import * as fs from 'fs/promises';

import { type Context } from '../../context';
import * as formatUtils from '../../formatUtils';
import * as fsUtils from '../../fsUtils';

export type ImportMapPlatformFlag = (
  | 'default'
  | 'node'
);

export type NodeImportMaps = {
  imports: Record<string, string | {
    [platform in ImportMapPlatformFlag]?: string
  }>,
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
  platform: ImportMapPlatformFlag,
): ImportMaps {
  const result: ImportMaps = {
    imports: {},
  };
  for (const [key, value] of Object.entries(importMaps.imports)) {
    if (typeof value === 'string') {
      result.imports[key] = value;
    } else if (typeof value === 'object') {
      if (platform === 'default') {
        if (value.default) {
          result.imports[key] = value.default;
        }
        // noop for the web target, if there is no default mapping
        // explicit mappings only required for the node target
      } else if (platform === 'node' && value.node) {
        result.imports[key] = value.node;
      } else if (platform === 'node' && value.default) {
        result.imports[key] = value.default;
      } else {
        throw new Error(`Couldn't resolve import maps entry "${key}" for "${formatUtils.formatPlatform(platform)}" platform condition`);
      }
    }
  }
  return result;
}