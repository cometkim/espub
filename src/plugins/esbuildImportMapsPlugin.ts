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
  const resolveModulePathFromImportMaps = async (modulePath: string) => {
    const resolved = path.resolve(path.dirname(context.importMapsPath), modulePath);
    const exist = await fsUtils.chooseExist([
      resolved.replace(/\.(c|m)?js$/, '.tsx'),
      resolved.replace(/\.(c|m)?js$/, '.ts'),
      resolved,
    ]);
    return exist || resolved;
  };
  return {
    name: '@nanobundle/import-maps',
    setup(build) {
      build.onResolve({ filter: /.*/ }, async args => {
        if (isExternalPath(args.path)) {
          const modulePath = replaceSubpathPattern(importMaps, args.path);
          const external = isExternalPath(modulePath);
          if (external) {
            return {
              path: modulePath,
              external,
            }
          } else {
            const resolvedModulePath = await resolveModulePathFromImportMaps(modulePath);
            return {
              path: resolvedModulePath,
            };
          }
        }
      });
    },
  };
};
