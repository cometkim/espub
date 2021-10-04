import type { Plugin } from 'esbuild';
import type { Reporter } from '../report';

type PluginOptions = {
  reporter: Reporter,
  standalone: boolean,
  externalDependencies: string[],
  forceExternalDependencies: string[],
};

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

  const shouldEmbed = (modulePath: string) => {
    if (forceExternalDependencies.some(dep => modulePath.startsWith(dep))) {
      return false;
    }
    return standalone || !externalDependencies.some(dep => modulePath.startsWith(dep));
  };

  return {
    name: 'nanobundle/embed',
    setup(build) {
      let isDependOnNode = false;

      build.onResolve({ filter: /.*/ }, args => {
        let resolvedAsNodeApi = isNodeApi(args.path);
        if (resolvedAsNodeApi) {
          isDependOnNode = true;
        }
        return {
          path: args.path,
          external: resolvedAsNodeApi || !shouldEmbed(args.path),
        };
      });

      build.onEnd(() => {
        if (isDependOnNode) {
          reporter.warn('Not completely standalone bundle, while the code depends on some Node.js APIs.');
        }
      });
    },
  };
}
