import type { Plugin } from 'esbuild';

import * as fsUtils from '../fsUtils';

type Imports = Record<string, string>;

type PluginOptions = {
  name: string,
  imports: Imports,
  resolvePath: (path: string) => string,
};

export function makePlugin({
  name,
  imports,
  resolvePath,
}: PluginOptions): Plugin {
  const isExternalPath = (path: string) => !fsUtils.isFileSystemReference(path);
  return {
    name: 'nanobundle/import-maps/' + name,
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (imports[args.path]) {
          const modulePath = imports[args.path];
          const external = isExternalPath(modulePath);
          return {
            path: external ? modulePath : resolvePath(modulePath),
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
              path: external ? modulePath : resolvePath(modulePath),
              external,
            };
          }
        }
      });
    },
  };
};
