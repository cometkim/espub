import * as fs from 'fs/promises';

import { type Context } from '../../context';
import * as fsUtils from '../../fsUtils';
import { type ConditionalImports } from '../../manifest';

import { type BundleOptions } from './entryGroup';

export type NodeImportMaps = {
  imports: ConditionalImports,
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
  const result: ImportMaps = {
    imports: {},
  };
  const { mode, module, platform } = bundleOptions;
  function normalize() {
  }
}
