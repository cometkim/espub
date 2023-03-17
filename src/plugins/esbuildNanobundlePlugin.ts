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
  context: {
    reporter,
    standalone,
    externalDependencies,
    forceExternalDependencies,
  },
  importMaps,
}: PluginOptions): Plugin {
  const ownedModule = (packageName: string, modulePath: string) => {
    return packageName === modulePath || modulePath.startsWith(packageName + '/');
  };

  const isNodeApi = (modulePath: string) => {
    if (externalDependencies.some(dep => modulePath.startsWith(dep))) {
      return false;
    }
    return modulePath.startsWith('node:') || nodeApis.some(api => ownedModule(api, modulePath));
  };

  const shouldEmbed = (modulePath: string) => {
    if (forceExternalDependencies.some(dep => ownedModule(dep, modulePath))) {
      return false;
    }
    return standalone || !externalDependencies.some(dep => ownedModule(dep, modulePath));
  };

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
    name: 'nanobundle',
    setup(build) {
      let dependOnNode = false;

      build.onResolve({ filter: /.*/ }, async args => {
        if (fsUtils.isFileSystemReference(args.path)) {
          return;
        }

        const modulePath = replaceSubpathPattern(importMaps, args.path);
        const external = !fsUtils.isFileSystemReference(modulePath);

        let resolvedAsNodeApi = isNodeApi(modulePath);
        if (resolvedAsNodeApi) {
          dependOnNode = true;
        }

        if (!resolvedAsNodeApi && shouldEmbed(modulePath)) {
          return {};
        }

        return {
          external,
          path: external
            ? modulePath
            : await resolveModulePathFromImportMaps(modulePath),
        };
      });

      build.onEnd(() => {
        if (standalone && dependOnNode) {
          reporter.warn('Not completely standalone bundle, while the code depends on some Node.js APIs.');
        }
      });
    },
  };
}

const nodeApis = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'crypto',
  'diagnostics_channel',
  'dns',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'readline',
  'stream',
  'string_decoder',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'dgram',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',

  // legacy
  'querystring',

  // deprecated
  '_linklist',
  '_stream_wrap',
  'constants',
  'domain',
  'punycode',
  'sys',
];
