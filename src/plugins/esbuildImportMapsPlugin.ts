import type { Plugin } from 'esbuild';

type Imports = Record<string, string>;

export function makePlugin(name: string, imports: Imports): Plugin {
  return {
    name: 'importMaps/' + name,
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (imports[args.path]) {
          return {
            path: imports[args.path],
          };
        }
        for (const [fromPrefix, toPrefix] of Object.entries(imports)) {
          if (!fromPrefix.endsWith('/')) {
            continue;
          }
          if (args.path.startsWith(fromPrefix)) {
            return {
              path: args.path.replace(fromPrefix, toPrefix),
            };
          }
        }
      });
    },
  };
};
