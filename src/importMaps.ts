import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

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
  env: 'web' | 'node'
): ImportMaps {
  const result: ImportMaps = {
    imports: {},
  };
  for (const [key, value] of Object.entries(importMaps.imports)) {
    if (typeof value === 'string') {
      result.imports[key] = value;
    } else if (typeof value === 'object') {
      if (env === 'web' && value.default) {
        result.imports[key] = value.default;
      } else if (env === 'node' && value.node) {
        result.imports[key] = value.node;
      } else if (env === 'node' && value.default) {
        result.imports[key] = value.default;
      } else {
        throw new Error(`Couldn't resolve import map entry ${key} for ${env} environment`);
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
