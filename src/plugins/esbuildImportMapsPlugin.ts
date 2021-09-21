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
  const isExternalPath = (path: string) => path.includes('/node_modules/');
  return {
    name: 'importMaps/' + name,
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (imports[args.path]) {
          const resolvedPath = resolvePath(imports[args.path]);
          return {
            path: resolvedPath,
            external: isExternalPath(resolvedPath),
          };
        }
        for (const [fromPrefix, toPrefix] of Object.entries(imports)) {
          if (!fromPrefix.endsWith('/')) {
            continue;
          }
          if (args.path.startsWith(fromPrefix)) {
            const resolvedPath = resolvePath(args.path.replace(fromPrefix, toPrefix));
            return {
              path: resolvedPath,
              external: isExternalPath(resolvedPath),
            };
          }
        }
      });
    },
  };
};
