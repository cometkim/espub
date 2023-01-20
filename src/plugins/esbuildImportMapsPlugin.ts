import * as path from 'node:path';
import { type Plugin } from 'esbuild';

import { type Context } from '../context';
import * as fsUtils from '../fsUtils';
import { type ImportMaps, replaceSubpathPattern } from '../importMaps';

type PluginOptions = {
  context: Context,
  importMaps: ImportMaps,
};

export function makePlugin({
  context,
  importMaps,
}: PluginOptions): Plugin {
  const isExternalPath = (path: string) => !fsUtils.isFileSystemReference(path);
  const resolveModulePathFromImportMaps = (modulePath: string) => {
    return path.resolve(path.dirname(context.importMapsPath), modulePath);
  }
  return {
    name: '@nanobundle/import-maps',
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        const modulePath = replaceSubpathPattern(importMaps, args.path);
        const external = isExternalPath(modulePath);
        return {
          path: external
            ? modulePath
            : resolveModulePathFromImportMaps(modulePath),
          external,
        };
      });
    },
  };
};
