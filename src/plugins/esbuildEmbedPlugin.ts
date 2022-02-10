import type { Plugin } from 'esbuild';
import type { Reporter } from '../report';
import { isFileSystemReference } from '../utils';

type PluginOptions = {
  reporter: Reporter,
  standalone: boolean,
  externalDependencies: string[],
  forceExternalDependencies: string[],
};

export function makePlugin({
  reporter,
  standalone,
  externalDependencies,
  forceExternalDependencies,
}: PluginOptions): Plugin {
  const isNodeApi = (modulePath: string) => {
    if (externalDependencies.some(dep => modulePath.startsWith(dep))) {
      return false;
    }
    return modulePath.startsWith('node:') || nodeApis.some(api => modulePath.startsWith(api));
  };

  const ownedModule = (packageName: string, modulePath: string) => {
    return packageName === modulePath || modulePath.startsWith(packageName + '/');
  };

  const shouldEmbed = (modulePath: string) => {
    if (forceExternalDependencies.some(dep => ownedModule(dep, modulePath))) {
      return false;
    }
    return standalone || !externalDependencies.some(dep => ownedModule(dep, modulePath));
  };

  return {
    name: 'nanobundle/embed',
    setup(build) {
      let dependOnNode = false;

      build.onResolve({ filter: /.*/ }, async args => {
        if (isFileSystemReference(args.path)) {
          return;
        }

        let resolvedAsNodeApi = isNodeApi(args.path);
        if (resolvedAsNodeApi) {
          dependOnNode = true;
        }

        let external = resolvedAsNodeApi || !shouldEmbed(args.path);
        let path = external ? args.path : undefined;

        return { path, external };
      });

      build.onEnd(() => {
        if (dependOnNode) {
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
