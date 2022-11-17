import * as path from 'node:path';
import type { ConditionalExport, Config } from './config';
import type { Reporter } from './report';

export type Entry = {
  key: string,
  entryPath: string,
  mode: 'development' | 'production',
  platform: 'netural' | 'browser' | 'deno' | 'node',
  module: 'commonjs' | 'esmodule' | 'dts' | 'file',
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
  }): Entry[];
};

export const getEntriesFromConfig: GetEntriesFromConfig = ({
  config,
  rootDir,
  outDir,
  reporter,
  resolvePath,
}) => {
  const resolvedOutDir = resolvePath(outDir);
  const resolvedRootDir = resolvePath(rootDir);

  const defaultPlatform: Entry['platform'] = 'netural';
  const defaultMode: Entry['mode'] = 'production';
  const defaultModule: Entry['module'] = (
    (config.type === 'module')
      ? 'esmodule'
      : 'commonjs'
  );

  const entryMap = new Map<Entry['entryPath'], Entry>();

  function addEntry({
    key, entryPath, platform, module, mode,
  }: {
    key: string,
    entryPath: string,
    platform: Entry['platform'],
    mode: Entry['mode'],
    module: Entry['module'],
  }) {
    if (!entryPath.startsWith('./')) {
      reporter.error(`Invalid entry "${key}", entry path should starts with \`"./"\``);
      throw new Error('FIXME');
    }

    if (key.includes('*') || entryPath.includes('*')) {
      reporter.warn(`Ignoring ${key}: subpath pattern(\`*\`) is not supported yet`);
      return;
    }

    const entry = entryMap.get(entryPath);
    if (entry) {
      if (entry.key.startsWith('exports') && !key.startsWith('exports')) {
        // exports should be prioritized
        reporter.warn(`
  Entry ${key} will be ignored since

    ${entry.key}
    { module: "${entry.module}", platform: "${entry.platform}" }

    precedense over

    (ignored) ${key}
    { module: "${module}", platform: "${platform}" }
  `);
        return;
      }

      if (entry.platform !== platform || entry.module !== module) {
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
      }
      return;
    }

    const resolvedOutputFile = resolvePath(entryPath);

    let resolvedSourceFile = resolvedOutputFile.replace(
      resolvedOutDir,
      resolvedRootDir,
    );
    if (mode === 'production') {
      const pattern = /\.min(?<ext>\.(m|c)?js)$/;
      const match = resolvedSourceFile.match(pattern);
      const ext = match?.groups?.ext;
      if (ext) {
        resolvedSourceFile = resolvedSourceFile.replace(pattern, ext);
      }
    }

    const sourceFileCandidates = new Set<string>();

    if (!resolvedOutputFile.endsWith('js')) {
      switch (module) {
        case 'commonjs': {
          sourceFileCandidates.add(resolvedSourceFile + '.cjs');
          sourceFileCandidates.add(resolvedSourceFile + '.js');
          break;
        }
        case 'esmodule': {
          sourceFileCandidates.add(resolvedSourceFile + '.mjs');
          sourceFileCandidates.add(resolvedSourceFile + '.js');
          break;
        }
      }
    }

    switch (module) {
      case 'commonjs': {
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.js$/, '.cjs'));
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.cjs$/, '.js'));
        break;
      }
      case 'esmodule': {
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.js$/, '.mjs'));
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.mjs$/, '.js'));
        break;
      }
    }

    sourceFileCandidates.add(resolvedSourceFile);

    entryMap.set(entryPath, {
      key,
      entryPath,
      mode,
      platform,
      module,
      sourceFile: [...sourceFileCandidates],
      outputFile: resolvedOutputFile,
    });
  }

  function addMainEntry({
    key, entryPath,
  }: {
    key: string,
    entryPath: string,
  }) {
    const ext = path.extname(entryPath);
    switch (ext) {
      case '.cjs': {
        addEntry({
          key,
          platform: defaultPlatform,
          mode: defaultMode,
          module: 'commonjs',
          entryPath,
        });
        break;
      }
      case '.mjs': {
        addEntry({
          key,
          platform: defaultPlatform,
          mode: defaultMode,
          module: 'esmodule',
          entryPath,
        });
        break;
      }
      case '.node': {
        addEntry({
          key,
          platform: 'node',
          mode: defaultMode,
          module: 'file',
          entryPath,
        });
        break;
      }
      case '.json': {
        addEntry({
          key,
          platform: defaultPlatform,
          mode: defaultMode,
          module: 'file',
          entryPath,
        });
        break;
      }
      // case '.js':
      default: {
        addEntry({
          key,
          platform: defaultPlatform,
          mode: defaultMode,
          module: defaultModule,
          entryPath,
        });
        break;
      }
    }
  }

  function addModuleEntry({
    key, entryPath,
  }: {
    key: string,
    entryPath: string,
  }) {
    const ext = path.extname(entryPath);
    if (ext === '.js' || ext === '.mjs') {
      addEntry({
        key,
        platform: defaultPlatform,
        mode: defaultMode,
        module: 'esmodule',
        entryPath,
      });
    } else {
      // FIXME: warn
    }
  }

  function addConditionalEntry({
    key, parentKey, platform, mode, module, entryPath,
  }: {
    key: string,
    parentKey: string,
    platform: Entry['platform'],
    mode: Entry['mode'],
    module: Entry['module'],
    entryPath: ConditionalExport,
  }) {
    if (typeof entryPath === 'string') {
      const ext = path.extname(entryPath);
      switch (ext) {
        case '.cjs': {
          addEntry({
            key,
            platform,
            mode,
            module: 'commonjs',
            entryPath,
          });
          break;
        }
        case '.mjs': {
          addEntry({
            key,
            platform,
            mode,
            module: 'esmodule',
            entryPath,
          });
          break;
        }
        case '.node': {
          addEntry({
            key,
            platform: 'node',
            mode,
            module: 'file',
            entryPath,
          });
          break;
        }
        case '.json': {
          addEntry({
            key,
            platform,
            mode,
            module: 'file',
            entryPath,
          });
          break;
        }
        // case '.js':
        default: {
          addEntry({
            key,
            platform,
            mode,
            module,
            entryPath,
          });
          break;
        }
      }
    } else if (typeof entryPath === 'object') {
      for (const [currentKey, output] of Object.entries(entryPath)) {
        // See https://nodejs.org/api/packages.html#packages_community_conditions_definitions
        switch (currentKey) {
          case 'import': {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode,
              module: 'esmodule',
              entryPath: output,
            });
            break;
          }
          case 'require': {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode,
              module: 'commonjs',
              entryPath: output,
            });
            break;
          }
          case 'types': {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode,
              module: 'dts',
              entryPath: output,
            });
            break;
          }
          case 'node': {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform: 'node',
              mode,
              module,
              entryPath: output,
            });
            break;
          }
          case 'deno': {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform: 'deno',
              mode,
              module,
              entryPath: output,
            });
            break;
          }
          case 'browser': {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform: 'browser',
              mode,
              module,
              entryPath: output,
            });
            break;
          }
          case 'development': {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode: 'development',
              module,
              entryPath: output,
            });
            break;
          }
          case 'production': {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode: 'production',
              module,
              entryPath: output,
            });
            break;
          }
          case '.': {
            addConditionalEntry({
              key: `${parentKey}[\"${currentKey}\"]`,
              parentKey: `${parentKey}[\"${currentKey}\"]`,
              platform,
              mode,
              module,
              entryPath: output,
            });
            break;
          }
          default: {
            if (currentKey.startsWith('./')) {
              addConditionalEntry({
                key: `${parentKey}[\"${currentKey}\"]`,
                parentKey: `${parentKey}[\"${currentKey}\"]`,
                platform,
                mode,
                module,
                entryPath: output,
              });
            } else {
            }
            break;
          }
        }
      }
    }
  }

  if (config.exports) {
    addConditionalEntry({
      key: 'exports',
      parentKey: 'exports',
      platform: defaultPlatform,
      mode: 'production',
      module: defaultModule,
      entryPath: config.exports,
    });
  } else {
    reporter.warn(`Using "exports" field is highly recommended.
See https://nodejs.org/api/packages.html for more detail.
`);
  }

  if (typeof config.main === 'string') {
    addMainEntry({
      key: 'main',
      entryPath: config.main,
    });
  }

  if (typeof config.module === 'string') {
    addModuleEntry({
      key: 'module',
      entryPath: config.module,
    });

    reporter.warn(`"module" field is not standard and may works in only legacy bundlers. Consider using "exports" instead.
See https://nodejs.org/api/packages.html for more detail.
`);
  }

  return Array.from(entryMap.values());
}
