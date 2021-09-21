import type { Plugin } from 'esbuild';

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
  return {
    name: 'importMaps/' + name,
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (imports[args.path]) {
          return {
            path: resolvePath(imports[args.path]),
          };
        }
        for (const [fromPrefix, toPrefix] of Object.entries(imports)) {
          if (!fromPrefix.endsWith('/')) {
            continue;
          }
          if (args.path.startsWith(fromPrefix)) {
            return {
              path: resolvePath(args.path.replace(fromPrefix, toPrefix)),
            };
          }
        }
      });
    },
  };
};
