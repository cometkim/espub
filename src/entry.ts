import * as path from 'node:path';
import type { Config } from './config';
import type { Reporter } from './report';

export type Entry = {
  key: string,
  path: string,
  platform: 'web' | 'node',
  module: 'commonjs' | 'esmodule',
  outputFile: string,
};

interface GetEntriesFromConfig {
  (props: {
    config: Config,
    resolvePath: (path: string) => string,
    reporter: Reporter,
  }): Entry[];
};

export const getEntriesFromConfig: GetEntriesFromConfig = ({
  config,
  reporter,
  resolvePath,
}) => {
  const defaultModule = (config.type === 'module')
    ? 'esmodule'
    : 'commonjs';

  const defaultPlatform = (typeof config.engines === 'object' && typeof config.engines.node === 'string')
    ? 'node'
    : 'web';

  const entryMap = new Map<string, Entry>();

  function addEntry(key: string, path: string, platform: Entry['platform'], module: Entry['module']) {
    if (!config.source) {
      return;
    }

    if (key.includes('*') || path.includes('*')) {
      reporter.warn(`Ignoring ${key}: subpath pattern(\`*\`) is not supported`);
      return;
    }

    const entry = entryMap.get(path);
    if (entry && (entry.platform !== platform || entry.module !== module)) {
      reporter.warn(`
Conflict found for ${path}

  ${entry.key}
  { module: "${entry.module}", platform: "${entry.platform}" }

  vs

  (ignored) ${key}
  { module: "${module}", platform: "${platform}" }

Did you forget to specify the Node.js version in the "engines" field?
Or you may not need to specify "require" or "node" entries.
`);
      return;
    }

    entryMap.set(path, {
      key,
      path,
      platform,
      module,
      outputFile: resolvePath(path),
    });
  }

  function addMainEntry(key: string, output: string) {
    const ext = path.extname(output);
    if (ext === '.js') {
      addEntry(key, output, defaultPlatform, defaultModule);
    } else if (ext === '.mjs') {
      addEntry(key, output, defaultPlatform, 'esmodule');
    } else if (ext === '.cjs' || ext === '.node') {
      addEntry(key, output, 'node', 'commonjs');
    }
  }

  function addModuleEntry(key: string, output: string) {
    const ext = path.extname(output);
    if (ext === '.js' || ext === '.mjs') {
      addEntry(key, output, defaultPlatform, 'esmodule');
    }
  }

  function addNodeEntry(key: string, output: string) {
    const ext = path.extname(output);
    if (ext === '.js' || ext === '.cjs' || ext === '.node') {
      addEntry(key, output, 'node', 'commonjs');
    }
  }

  if (config.main) {
    addMainEntry('main', config.main);
  }

  if (config.module) {
    addModuleEntry('module', config.module);
  }

  if (config.exports) {
    if (typeof config.exports === 'string') {
      addMainEntry('exports', config.exports);
    } else if (typeof config.exports === 'object') {
      for (const [key, output] of Object.entries(config.exports)) {
        if (typeof output === 'string') {
          if (key === 'import') {
            addModuleEntry(`exports["${key}"]`, output);
          } else if (key === 'require') {
            addNodeEntry(`exports["${key}"]`, output);
          } else {
            addMainEntry(`exports["${key}"]`, output);
          }
        } else if (typeof output === 'object') {
          if (output.default) {
            addMainEntry(`exports["${key}"].default`, output.default);
          }
          if (output.import) {
            addModuleEntry(`exports["${key}"].import`, output.import);
          }
          if (output.require) {
            addNodeEntry(`exports["${key}"].require`, output.require);
          }
          if (output.node) {
            addNodeEntry(`exports["${key}"].node`, output.node);
          }
        }
      }
    }
  } else {
    reporter.warn(`Using "exports" field is highly recommended.
See https://nodejs.org/api/packages.html for more detail.
`);
  }

  return Array.from(entryMap.values());
}
