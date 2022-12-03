import * as path from 'node:path';
import dedent from 'string-dedent';
import kleur from 'kleur';

import { type ConditionalExport } from './manifest';
import { type Context } from './context';
import { type Reporter } from './reporter';
import * as formatUtils from './formatUtils';
import {
  NanobundleConfusingDtsEntryError,
  NanobundleInvalidDtsEntryError,
  NanobundleInvalidDtsEntryOrderError,
} from './errors';

export type Entry = {
  key: string;
  entryPath: string;
  minify: boolean;
  mode: undefined | 'development' | 'production';
  sourcemap: boolean;
  platform: "neutral" | "browser" | "deno" | "node";
  module: "commonjs" | "esmodule" | "dts" | "file";
  sourceFile: string[];
  outputFile: string;
};

interface GetEntriesFromContext {
  (props: {
    context: Context;
    resolve: (cwd: string, path: string) => string;
    reporter: Reporter;
  }): Entry[];
}
export const getEntriesFromContext: GetEntriesFromContext = ({
  context,
  reporter,
  resolve: resolvePathFrom,
}) => {
  const defaultMinify: Entry['minify'] = false;
  const defaultMode: Entry['mode'] = undefined;
  const {
    cwd,
    rootDir,
    outDir,
    sourcemap,
    manifest,
    platform: defaultPlatform,
    module: defaultModule,
    declaration,
  } = context;

  const defaultPreferredModule = ({
    commonjs: 'commonjs',
    esmodule: 'esmodule',
    dts: undefined,
    file: undefined,
  } as const)[defaultModule];

  const resolvePath = (path: string) => resolvePathFrom(cwd, path);
  const resolvedRootDir = resolvePath(rootDir);
  const resolvedOutDir = resolvePath(outDir);

  const useTsSource = declaration;
  const useJsSource = !(useTsSource && resolvedRootDir === resolvedOutDir);

  const entryMap = new Map<Entry["entryPath"], Entry>();

  function addEntry({
    key,
    entryPath,
    platform,
    module,
    mode,
    preferredModule,
  }: {
    key: string,
    entryPath: string,
    platform: Entry['platform'],
    mode: Entry['mode'],
    module: Entry['module'],
    preferredModule?: 'esmodule' | 'commonjs',
  }) {
    if (!entryPath.startsWith('./')) {
      reporter.error(
        `Invalid entry ${formatUtils.key(key)}, entry path should starts with ${formatUtils.literal('./')}`,
      );
      throw new Error("FIXME");
    }

    if (key.includes("*") || entryPath.includes("*")) {
      reporter.error(
        `Ignoring ${formatUtils.key(key)}: subpath pattern(\`*\`) is not supported yet`,
      );
      throw new Error("FIXME");
    }

    if (module === 'dts' && !/\.d\.(c|m)?ts$/.test(entryPath)) {
      throw new NanobundleInvalidDtsEntryError();
    }

    const entry = entryMap.get(entryPath);
    if (entry) {
      // exports should be prioritized
      if (entry.key.startsWith("exports") && !key.startsWith("exports")) {
        if (entry.platform !== platform || entry.module !== module) {
          reporter.warn(
            dedent`
              Entry ${formatUtils.key(key)} will be ignored since

                  %s
                  %s

                precedense over

                  %s ${kleur.bold('(ignored)')}
                  %s

            `,
            formatUtils.key(entry.key),
            formatUtils.object({ module: entry.module, platform: entry.platform }),
            formatUtils.key(key),
            formatUtils.object({ module, platform }),
          );
        }
        return;
      }

      if (entry.platform !== platform || entry.module !== module) {
        let msg = formatUtils.format(
          dedent`
            Conflict found for ${formatUtils.path(entryPath)}

                %s
                %s

              vs

                %s ${kleur.bold('(conflited)')}
                %s
          `,
          formatUtils.key(entry.key),
          formatUtils.object({ module: entry.module, platform: entry.platform }),
          formatUtils.key(key),
          formatUtils.object({ module, platform }),
        );
        let hint = '';
        if (
          (entry.key === 'main' && key === 'module') ||
          (entry.key === 'module' && key === 'main')
        ) {
          hint = dedent`
            Did you forgot to set ${formatUtils.key('type')} to ${formatUtils.literal('module')} for ESM-first approach?
          `;
        }
        if (
          entry.module === module &&
          entry.platform !== platform
        ) {
          hint = dedent`
            Did you forget to specify the Node.js version in the ${formatUtils.key('engines')} field?
            Or you may not need to specify ${formatUtils.key('require')} or ${formatUtils.key('node')} entries.
          `;
        }
        if (hint) {
          msg += '\n\n';
          msg += hint;
          msg += '\n';
        }
        reporter.error(msg);
        throw new Error("FIXME");
      }
      return;
    }

    const sourceFileCandidates = new Set<string>();

    const resolvedOutputFile = resolvePath(entryPath);
    let resolvedSourceFile = resolvedOutputFile.replace(
      resolvedOutDir,
      resolvedRootDir,
    );


    const minifyPattern = /\.min(?<ext>\.(m|c)?js)$/;
    const minifyMatch = resolvedSourceFile.match(minifyPattern);
    const minify = defaultMinify || Boolean(minifyMatch);
    const ext = minifyMatch?.groups?.ext;
    if (ext) {
      resolvedSourceFile = resolvedSourceFile.replace(minifyPattern, ext);
    }

    if (!resolvedOutputFile.endsWith('js')) {
      switch (module) {
        case 'commonjs': {
          useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.cts`);
          useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.cjs`);
          useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.ts`);
          useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.js`);
          break;
        }
        case 'esmodule': {
          useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.mts`);
          useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.mjs`);
          useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.ts`);
          useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.js`);
          break;
        }
      }
    }

    switch (module) {
      case 'commonjs': {
        useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?js$/, ".cts"));
        useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?js$/, ".cjs"));
        useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?js$/, ".ts"));
        useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?js$/, ".js"));
        break;
      }
      case 'esmodule': {
        useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?js$/, ".mts"));
        useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?js$/, ".mjs"));
        useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?js$/, ".ts"));
        useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?js$/, ".js"));
        break;
      }
      case 'dts': {
        if (!useTsSource) break;
        if (preferredModule === 'commonjs') {
          sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.c?ts$/, '.cts'));
        }
        if (preferredModule === 'esmodule') {
          sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.m?ts$/, '.mts'));
        }
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.(m|c)?ts$/, '.ts'));
        break;
      }
    }

    switch (module) {
      case 'commonjs':
      case 'esmodule': {
        useJsSource && sourceFileCandidates.add(resolvedSourceFile);
        break;
      }
      case 'file': {
        if (path.relative(cwd, path.dirname(resolvedOutputFile))) {
          sourceFileCandidates.add(resolvedSourceFile);
        } else {
          sourceFileCandidates.add(resolvedOutputFile);
        }
        break;
      }
    }

    entryMap.set(entryPath, {
      key,
      entryPath,
      mode,
      minify,
      sourcemap,
      platform,
      module,
      sourceFile: [...sourceFileCandidates],
      outputFile: resolvedOutputFile,
    });
  }

  function addMainEntry({
    key,
    entryPath,
  }: {
    key: string;
    entryPath: string;
  }) {
    const ext = path.extname(entryPath);
    switch (ext) {
      case '.cjs': {
        addEntry({
          key,
          platform: defaultPlatform,
          mode: defaultMode,
          module: 'commonjs',
          preferredModule: 'commonjs',
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
          preferredModule: 'esmodule',
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
          module: "file",
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
    key,
    entryPath,
  }: {
    key: string;
    entryPath: string;
  }) {
    const ext = path.extname(entryPath);
    if (ext === '.js' || ext === '.mjs') {
      addEntry({
        key,
        platform: defaultPlatform,
        mode: defaultMode,
        module: 'esmodule',
        preferredModule: 'esmodule',
        entryPath,
      });
    } else {
      // FIXME: warn
    }
  }

  function addTypesEntry({
    key,
    entryPath,
  }: {
    key: string;
    entryPath: string;
  }) {
    if (entryPath.endsWith('.d.ts')) {
      addEntry({
        key,
        platform: defaultPlatform,
        mode: defaultMode,
        module: 'dts',
        preferredModule: defaultPreferredModule,
        entryPath,
      });
    } else {
      throw new Error('"types" entry must has .d.ts extension!');
    }
  }

  function addConditionalEntry({
    key,
    parentKey,
    platform,
    mode,
    module,
    preferredModule,
    entryPath,
  }: {
    key: string,
    parentKey: string,
    platform: Entry['platform'],
    mode: Entry['mode'],
    module: Entry['module'],
    preferredModule?: 'commonjs' | 'esmodule',
    entryPath: ConditionalExport,
  }) {
    if (typeof entryPath === 'string') {
      if (parentKey === 'types') {
        addEntry({
          key,
          platform,
          mode,
          module: 'dts',
          preferredModule,
          entryPath,
        });
        return;
      }

      const ext = path.extname(entryPath);
      switch (ext) {
        case '.cjs': {
          addEntry({
            key,
            platform,
            mode,
            module: 'commonjs',
            preferredModule: 'commonjs',
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
            preferredModule: 'esmodule',
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
            preferredModule,
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
            preferredModule,
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
            preferredModule,
            entryPath,
          });
          break;
        }
      }
    } else if (typeof entryPath === 'object') {
      if (parentKey === 'types') {
        throw new NanobundleInvalidDtsEntryError();
      }

      let entries = Object.entries(entryPath);

      if (typeof entryPath.types !== 'undefined') {
        const typesEntryIndex = entries.findIndex(entry => entry[0] === 'types');
        if (typesEntryIndex !== 0) {
          throw new NanobundleInvalidDtsEntryOrderError();
        }
      } else {
        const firstLeaf = entries.find(entry => typeof entry[1] === 'string');
        const isLeaf = firstLeaf !== undefined;

        // has leaf default entry
        if (useTsSource && isLeaf) {
          if (typeof entryPath.default === 'string') {
            const dtsExport: [string, ConditionalExport] = [
              'types$implicit',
              inferDtsEntry(entryPath.default),
            ];
            entries = [dtsExport, ...entries];
          } else if (typeof entryPath.require === 'string' && typeof entryPath.import === 'string') {
            throw new NanobundleConfusingDtsEntryError(key, entryPath.require, entryPath.import);
          } else if (typeof entryPath.require === 'string') {
            const dtsExport: [string, ConditionalExport] = [
              'types$implicit',
              inferDtsEntry(entryPath.require),
            ];
            entries = [dtsExport, ...entries];
          } else if (typeof entryPath.import === 'string') {
            const dtsExport: [string, ConditionalExport] = [
              'types$implicit',
              inferDtsEntry(entryPath.import),
            ];
            entries = [dtsExport, ...entries];
          } else if (preferredModule) {
            const dtsExport: [string, ConditionalExport] = [
              'types$implicit',
              inferDtsEntry(firstLeaf[1] as string),
            ];
            entries = [dtsExport, ...entries];
          } else {
            reporter.warn(dedent`
              ${formatUtils.key(key)} entry may not resolve correctly in TypeScript's Node16 moduleResolution.
              Consider to specify ${formatUtils.key('types')} entry for it.
            `);
          }
        }
      }

      for (const [currentKey, output] of entries) {
        // See https://nodejs.org/api/packages.html#packages_community_conditions_definitions
        switch (currentKey) {
          case 'import': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode,
              module: 'esmodule',
              preferredModule: 'esmodule',
              entryPath: output,
            });
            break;
          }
          case 'require': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode,
              module: 'commonjs',
              preferredModule: 'commonjs',
              entryPath: output,
            });
            break;
          }
          case 'types': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode,
              module: 'dts',
              preferredModule: undefined,
              entryPath: output,
            });
            break;
          }
          case 'types$implicit': {
            addConditionalEntry({
              key: `${key}.types`,
              parentKey: currentKey,
              platform,
              mode,
              module: 'dts',
              preferredModule,
              entryPath: output,
            });
            break;
          }
          case 'node': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform: 'node',
              mode,
              module,
              preferredModule,
              entryPath: output,
            });
            break;
          }
          case 'deno': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform: 'deno',
              mode,
              module,
              preferredModule,
              entryPath: output,
            });
            break;
          }
          case 'browser': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform: 'browser',
              mode,
              module,
              preferredModule,
              entryPath: output,
            });
            break;
          }
          case 'development': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode: 'development',
              module,
              preferredModule,
              entryPath: output,
            });
            break;
          }
          case 'production': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode: 'production',
              module,
              preferredModule,
              entryPath: output,
            });
            break;
          }
          case 'default': {
            addConditionalEntry({
              key: `${key}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode,
              module,
              preferredModule,
              entryPath: output,
            });
            break;
          }
          case '.': {
            addConditionalEntry({
              key: `${key}[\"${currentKey}\"]`,
              parentKey: currentKey,
              platform,
              mode,
              module,
              preferredModule,
              entryPath: output,
            });
            break;
          }
          default: {
            if (currentKey.startsWith('./')) {
              addConditionalEntry({
                key: `${key}[\"${currentKey}\"]`,
                parentKey: currentKey,
                platform,
                mode,
                module,
                preferredModule,
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

  if (manifest.exports) {
    addConditionalEntry({
      key: "exports",
      parentKey: "exports",
      platform: defaultPlatform,
      mode: defaultMode,
      module: defaultModule,
      preferredModule: defaultPreferredModule,
      entryPath: manifest.exports,
    });
  } else if (manifest.main || manifest.module) {
    reporter.warn(dedent`
      Using ${formatUtils.key('exports')} field is highly recommended.
        See ${formatUtils.hyperlink('https://nodejs.org/api/packages.html')} for more detail.

    `);
  }

  if (typeof manifest.main === 'string') {
    addMainEntry({
      key: 'main',
      entryPath: manifest.main,
    });
  }

  if (typeof manifest.module === 'string') {
    addModuleEntry({
      key: 'module',
      entryPath: manifest.module,
    });

    reporter.warn(dedent`
      ${formatUtils.key('module')} field is not standard and may works in only legacy bundlers. Consider using ${formatUtils.key('exports')} instead.
        See ${formatUtils.hyperlink('https://nodejs.org/api/packages.html')} for more detail.

    `);
  }

  if (typeof manifest.types === 'string') {
    addTypesEntry({
      key: 'types',
      entryPath: manifest.types,
    });
  }

  return Array.from(entryMap.values());
};

function inferDtsEntry(entryPath: string): string {
  return entryPath.replace(/(\.min)?\.(m|c)?js$/, '.d.$2ts');
}