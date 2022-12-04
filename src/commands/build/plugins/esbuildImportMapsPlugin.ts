import { type Plugin } from 'esbuild';

import { type Context } from '../../../context';
import * as fsUtils from '../../../fsUtils';
import {
  type ImportMaps,
  type ImportMapPlatformFlag,
} from '../importMaps';

type PluginOptions = {
  context: Context,
  platform: ImportMapPlatformFlag,
  importMaps: ImportMaps,
};

export function makePlugin({
  context,
  platform,
  importMaps: {
    imports,
  },
}: PluginOptions): Plugin {
  const isExternalPath = (path: string) => !fsUtils.isFileSystemReference(path);
  return {
    name: `@nanobundle/import-maps/${platform}`,
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (imports[args.path]) {
          const modulePath = imports[args.path];
          const external = isExternalPath(modulePath);
          return {
            path: external
              ? modulePath
              : context.resolve(context.cwd, modulePath),
            external,
          };
        }
        for (const [fromPrefix, toPrefix] of Object.entries(imports)) {
          if (!fromPrefix.endsWith('/')) {
            continue;
          }
          if (args.path.startsWith(fromPrefix)) {
            const modulePath = args.path.replace(fromPrefix, toPrefix);
            const external = isExternalPath(modulePath);
            return {
              path: external
                ? modulePath
                : context.resolve(context.cwd, modulePath),
              external,
            };
          }
        }
      });
    },
  };
};
