import * as fs from 'node:fs/promises';

type NodeImportMaps = {
  imports: Record<string, string | {
    default?: string,
    node?: string,
  }>,
};

type ImportMaps = {
  imports: Record<string, string>,
};

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
  filePath: string,
  resolvePath: (path: string) => string,
}

export async function loadImportMaps({
  filePath,
  resolvePath,
}: LoadImportMapsOptions): Promise<NodeImportMaps> {
  const importMapsPath = resolvePath(filePath);

  const { imports = {} } = await fs.readFile(importMapsPath, 'utf-8')
    .then(JSON.parse) as Partial<NodeImportMaps>;

  return { imports };
}
