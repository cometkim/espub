import { type Plugin } from 'esbuild';

import { type Context } from '../context';
import * as fsUtils from '../fsUtils';
import { type ImportMaps } from '../importMaps';

type PluginOptions = {
  context: Context,
  importMaps: ImportMaps,
};

export function makePlugin({
  context,
  importMaps: {
    imports,
  },
}: PluginOptions): Plugin {
  const isExternalPath = (path: string) => !fsUtils.isFileSystemReference(path);
  return {
    name: `@nanobundle/import-maps`,
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (imports[args.path]) {
          const modulePath = imports[args.path];
          const external = isExternalPath(modulePath);
          return {
            path: external
              ? modulePath
              : context.resolvePath(modulePath),
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
                : context.resolvePath(modulePath),
              external,
            };
          }
        }
      });
    },
  };
};
