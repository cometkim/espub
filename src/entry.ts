import * as path from 'node:path';
import type { Config } from './config';
import type { Reporter } from './report';
import type {
  CompilerOptions as TSCompilerOptions,
} from 'typescript';

export type Entry = {
  key: string,
  path: string,
  mode: 'development' | 'production',
  platform: 'browser' | 'deno' | 'node',
  module: 'commonjs' | 'esmodule' | 'file',
  sourceFile: string[],
  outputFile: string,
};

interface GetEntriesFromConfig {
  (props: {
    config: Config,
    rootDir: string,
    outDir: string,
    resolvePath: (path: string) => string,
    reporter: Reporter,
    tsCompilerOptions?: TSCompilerOptions,
  }): Entry[];
};

export const getEntriesFromConfig: GetEntriesFromConfig = ({
  config,
  rootDir,
  outDir,
  reporter,
  resolvePath,
  tsCompilerOptions,
}) => {
  const resolvedOutDir = resolvePath(outDir);
  const resolvedRootDir = resolvePath(rootDir);

  const defaultModule = (config.type === 'module')
    ? 'esmodule'
    : 'commonjs';

  const defaultPlatform = (typeof config.engines === 'object' && typeof config.engines.node === 'string')
    ? 'node'
    : 'browser';

  const entryMap = new Map<string, Entry>();

  function addEntry({
    key, entryPath, platform, module, mode,
  }: {
    key: string,
    entryPath: string,
    platform: Entry['platform'],
    module: Entry['module'],
    mode: 'development' | 'production',
  }) {
    if (!entryPath.startsWith('./')) {
      reporter.error(`Invalid entry "${key}", entry path should starts with \`"./"\``);
      throw new Error('FIXME');
    }

    if (key.includes('*') || entryPath.includes('*')) {
      reporter.warn(`Ignoring ${key}: subpath pattern(\`*\`) is not supported yet`);
      return;
    }

    if (key === 'module') {
      reporter.warn('FIXME: non-standard alert');
    }

    const entry = entryMap.get(entryPath);
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

    const resolvedEntryPath = resolvePath(entryPath);
    entryMap.set(entryPath, {
      key,
      path: entryPath,
      mode,
      platform,
      module,
      sourceFile: [
        resolvedEntryPath.replace(
          resolvedOutDir,
          resolvedRootDir,
        ),
      ],
      outputFile: resolvedEntryPath,
    });
  }

  function addMainEntry({
    key, entryPath, mode,
  }: {
    key: string,
    entryPath: string,
    mode: 'development' | 'production',
  }) {
    const ext = path.extname(entryPath);
    switch (ext) {
      case '.cjs': {
        addEntry({
          key,
          mode,
          entryPath,
          platform: defaultPlatform,
          module: 'commonjs',
        });
        break;
      }
      case '.mjs': {
        addEntry({
          key,
          mode,
          entryPath,
          platform: defaultPlatform,
          module: 'esmodule',
        });
        break;
      }
      case '.node': {
        addEntry({
          key,
          mode,
          entryPath,
          platform: 'node',
          module: 'file',
        });
        break;
      }
      case '.json': {
        addEntry({
          key,
          mode,
          entryPath,
          platform: defaultPlatform,
          module: 'file',
        });
        break;
      }
      // case '.js':
      default: {
        addEntry({
          key,
          mode,
          entryPath,
          platform: defaultPlatform,
          module: defaultModule,
        });
        break;
      }
    }
  }

  function addModuleEntry({
    key, entryPath, mode,
  }: {
    key: string,
    entryPath: string,
    mode: 'development' | 'production',
  }) {
    const ext = path.extname(entryPath);
    if (ext === '.js' || ext === '.mjs') {
      addEntry({
        key,
        mode,
        entryPath,
        platform: defaultPlatform,
        module: 'esmodule',
      });
    } else {
      // FIXME: warn
    }
  }

  function addNodeEntry({
    key, entryPath, mode,
  }: {
    key: string,
    entryPath: string,
    mode: 'development' | 'production',
  }) {
    const ext = path.extname(entryPath);
    if (ext === '.js' || ext === '.cjs' || ext === '.node') {
      addEntry({
        key,
        mode,
        entryPath,
        platform: 'node',
        module: 'commonjs',
      });
    } else {
      // FIXME: warn
    }
  }

  if (typeof config.main === 'string') {
    addMainEntry({
      key: 'main',
      mode: 'production',
      entryPath: config.main,
    });
  }

  if (config.exports) {
    if (typeof config.exports === 'string') {
      addMainEntry({
        key: 'exports',
        mode: 'production',
        entryPath: config.exports,
      });
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

  if (typeof config.module === 'string') {
    addModuleEntry({
      key: 'module',
      mode: 'production',
      entryPath: config.module,
    });
  }

  return Array.from(entryMap.values());
}
