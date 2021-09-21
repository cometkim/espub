import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { formatPlatform } from './utils';

type NodeImportMaps = {
  imports: Record<string, string | {
    default?: string,
    node?: string,
  }>,
};

type ImportMaps = {
  imports: Record<string, string>,
};

type ValidImportMaps = ImportMaps & { __BRAND__: 'ValidImportMaps' };

export function normalizeImportMaps(
  importMaps: NodeImportMaps,
  platform: 'web' | 'node'
): ImportMaps {
  const result: ImportMaps = {
    imports: {},
  };
  for (const [key, value] of Object.entries(importMaps.imports)) {
    if (typeof value === 'string') {
      result.imports[key] = value;
    } else if (typeof value === 'object') {
      if (platform === 'web') {
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
        throw new Error(`Couldn't resolve import maps entry "${key}" for ${formatPlatform(platform)} environment`);
      }
    }
  }
  return result;
}

type LoadImportMapsOptions = {
  resolvePath: (path: string) => string,
}

export async function loadImportMaps(filePath: string, {
  resolvePath,
}: LoadImportMapsOptions): Promise<NodeImportMaps> {
  const importMapsPath = resolvePath(filePath);

  const { imports = {} } = await fs.readFile(importMapsPath, 'utf-8')
    .then(JSON.parse) as Partial<NodeImportMaps>;

  return { imports };
}

type ValidateImportMapsOptions = {
  resolvePath: (path: string) => string,
}

export function validateImportMaps(importMaps: ImportMaps, {
  resolvePath,
}: ValidateImportMapsOptions): ValidImportMaps {
  for (const path of Object.values(importMaps.imports)) {
    const resolvedPath = resolvePath(path);
    if (!existsSync(resolvedPath)) {
      throw new Error(`${resolvedPath} doesn't exist`);
    }
  }
  return importMaps as ValidImportMaps;
}
