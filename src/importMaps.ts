import * as path from 'node:path';
import * as fs from 'node:fs/promises';

import { type Context } from './context';
import * as formatUtils from './formatUtils';
import * as fsUtils from './fsUtils';
import { type ConditionalImports } from './manifest';
import { NanobundleConfigError } from './errors';

import { type BundleOptions } from './entryGroup';

const importSubpathPattern = /^(?<dirname>.+\/)(?<filename>(?<base>[^\/\.]+?)(?<ext>\..+)?)$/;

export type NodeImportMaps = {
  imports: Exclude<ConditionalImports, string>,
};
export type ValidNodeImportMaps = NodeImportMaps & { __BRAND__: 'ValidNodeImportMaps' };
export type ImportMaps = {
  imports: Record<string, string>,
};

export async function loadImportMaps(context: Context): Promise<NodeImportMaps> {
  const { imports = {} } = await fs.readFile(context.importMapsPath, 'utf-8')
    .then(JSON.parse) as Partial<NodeImportMaps>;
  return { imports };
}

type ValidateNodeImportMapsOptions = {
  context: Context,
  importMaps: NodeImportMaps,
  rootKey?: string,
}
export async function validateImportMaps({
  context,
  importMaps,
  rootKey,
}: ValidateNodeImportMapsOptions): Promise<ValidNodeImportMaps> {
  for (const [key, importPath] of Object.entries(importMaps.imports)) {
    if (typeof importPath === 'object') {
      await validateImportMaps({
        context,
        importMaps: {
          imports: importPath,
        },
        rootKey: rootKey || key,
      });
    } else {
      if (!(rootKey || key).startsWith('#')) {
        if (
          key.endsWith('/') ||
          key.includes('*') ||
          importPath.endsWith('/') ||
          importPath.includes('*')
        ) {
          throw new NanobundleConfigError(
            'Directory or subpath pattern imports is supported only for Node.js-style imports like #pattern',
          );
        }
      }

      if (!fsUtils.isFileSystemReference(importPath)) {
        // Loosen validation if path doesn't seems to be a file system reference
        // Instead, expecting it can be resolved as a Node.js module later
        continue;
      }

      const resolvedPath = path.resolve(
        path.dirname(context.importMapsPath),
        importPath.includes('*')
          ? path.dirname(importPath)
          : importPath,
      );
      const exist = await fsUtils.exists(resolvedPath);
      if (!exist) {
        throw new NanobundleConfigError(`${formatUtils.path(resolvedPath)} doesn't exist`);
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
    customConditions: BundleOptions['customConditions'],
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
              customConditions,
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
              customConditions,
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
              customConditions,
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
              customConditions,
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
              customConditions,
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
              customConditions,
            );
          }
        }
        if (customConditions.includes(key)) {
          if (typeof value === 'string') {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode,
              module,
              platform,
              customConditions,
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
              customConditions,
            );
          }
        }
        continue;
      }
      return rootKey;
    }
  }

  const { mode, module, platform, customConditions } = bundleOptions;
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
      customConditions,
    );
  }

  return result;
}

export function replaceSubpathPattern(importMaps: ImportMaps, modulePath: string): string {
  if (importMaps.imports[modulePath]) {
    return importMaps.imports[modulePath];
  }

  const importsEntries = Object.entries(importMaps.imports)
    .sort(([from, _to]) => {
      if (from.includes('*')) {
        return -1;
      }
      return 0;
    });

  const matchCache: Record<string, RegExpMatchArray | undefined> = {};

  for (const [fromPrefix, toPrefix] of importsEntries) {
    if (modulePath.startsWith(fromPrefix)) {
      return modulePath.replace(fromPrefix, toPrefix);
    }

    const fromPrefixMatch = matchCache[fromPrefix] || fromPrefix.match(importSubpathPattern);
    const toPrefixMatch = matchCache[toPrefix] || toPrefix.match(importSubpathPattern);
    const modulePathMatch = matchCache[modulePath] || modulePath.match(importSubpathPattern);

    if (fromPrefixMatch?.groups?.['dirname'] === modulePathMatch?.groups?.['dirname']) {
      if (fromPrefixMatch?.groups?.['filename'] === '*') {
        return (toPrefixMatch?.groups?.['dirname'] || '') +
          (toPrefixMatch?.groups?.['base'] === '*'
            ? modulePathMatch?.groups?.['filename'] + (toPrefixMatch?.groups?.['ext'] || '')
            : (toPrefixMatch?.groups?.['filename'] || '')
          );
      }
      if (fromPrefixMatch?.groups?.['base'] === '*') {
        if (fromPrefixMatch?.groups?.['ext'] === modulePathMatch?.groups?.['ext']) {
          return (toPrefixMatch?.groups?.['dirname'] || '') +
            (modulePathMatch?.groups?.['base'] || '') + (toPrefixMatch?.groups?.['ext'] || '');
        }
      }
    }
  }

  return modulePath;
}
