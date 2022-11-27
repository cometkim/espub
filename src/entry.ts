import * as path from 'node:path';
import dedent from 'string-dedent';
import kleur from 'kleur';

import { type ConditionalExport } from './manifest';
import { type Context } from './context';
import { type Reporter } from './reporter';
import * as formatUtils from './formatUtils';

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
    platform: defaultPlatform,
    module: defaultModule,
    sourcemap,
    manifest,
    declaration: useTs,
  } = context;
  const resolvePath = (path: string) => resolvePathFrom(cwd, path);
  const resolvedRootDir = resolvePath(rootDir);
  const resolvedOutDir = resolvePath(outDir);

  const entryMap = new Map<Entry["entryPath"], Entry>();

  function addEntry({
    key,
    entryPath,
    platform,
    module,
    mode,
  }: {
    key: string;
    entryPath: string;
    platform: Entry["platform"];
    mode: Entry["mode"];
    module: Entry["module"];
  }) {
    if (!entryPath.startsWith("./")) {
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
          useTs && sourceFileCandidates.add(`${resolvedSourceFile}.cts`);
          sourceFileCandidates.add(`${resolvedSourceFile}.cjs`);
          useTs && sourceFileCandidates.add(`${resolvedSourceFile}.ts`);
          sourceFileCandidates.add(`${resolvedSourceFile}.js`);
          break;
        }
        case 'esmodule': {
          useTs && sourceFileCandidates.add(`${resolvedSourceFile}.mts`);
          sourceFileCandidates.add(`${resolvedSourceFile}.mjs`);
          useTs && sourceFileCandidates.add(`${resolvedSourceFile}.ts`);
          sourceFileCandidates.add(`${resolvedSourceFile}.js`);
          break;
        }
      }
    }

    switch (module) {
      case 'commonjs': {
        useTs && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?js$/, ".cts"));
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?js$/, ".cjs"));
        useTs && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?js$/, ".ts"));
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?js$/, ".js"));
        break;
      }
      case 'esmodule': {
        useTs && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?js$/, ".mts"));
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?js$/, ".mjs"));
        useTs && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?js$/, ".ts"));
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?js$/, ".js"));
        break;
      }
      case 'dts': {
        if (!useTs) break;
        if (manifest.type === 'module') {
          sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.ts$/, '.mts'));
          sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.ts$/, '.cts'));
        } else {
          sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.ts$/, '.cts'));
          sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.ts$/, '.mts'));
        }
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.ts$/, '.ts'));
        break;
      }
    }

    switch (module) {
      case 'commonjs':
      case 'esmodule':
      case 'file':
        sourceFileCandidates.add(resolvedSourceFile);
        break;
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
      case ".cjs": {
        addEntry({
          key,
          platform: defaultPlatform,
          mode: defaultMode,
          module: "commonjs",
          entryPath,
        });
        break;
      }
      case ".mjs": {
        addEntry({
          key,
          platform: defaultPlatform,
          mode: defaultMode,
          module: "esmodule",
          entryPath,
        });
        break;
      }
      case ".node": {
        addEntry({
          key,
          platform: "node",
          mode: defaultMode,
          module: "file",
          entryPath,
        });
        break;
      }
      case ".json": {
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
    if (/\.d\.ts$/.test(entryPath)) {
      addEntry({
        key,
        platform: defaultPlatform,
        mode: defaultMode,
        module: 'dts',
        entryPath,
      });
    } else {
      // FIXME: error
    }
  }

  function addConditionalEntry({
    key,
    parentKey,
    platform,
    mode,
    module,
    entryPath,
  }: {
    key: string;
    parentKey: string;
    platform: Entry["platform"];
    mode: Entry["mode"];
    module: Entry["module"];
    entryPath: ConditionalExport;
  }) {
    if (typeof entryPath === "string") {
      const ext = path.extname(entryPath);
      switch (ext) {
        case ".cjs": {
          addEntry({
            key,
            platform,
            mode,
            module: "commonjs",
            entryPath,
          });
          break;
        }
        case ".mjs": {
          addEntry({
            key,
            platform,
            mode,
            module: "esmodule",
            entryPath,
          });
          break;
        }
        case ".node": {
          addEntry({
            key,
            platform: "node",
            mode,
            module: "file",
            entryPath,
          });
          break;
        }
        case ".json": {
          addEntry({
            key,
            platform,
            mode,
            module: "file",
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
    } else if (typeof entryPath === "object") {
      for (const [currentKey, output] of Object.entries(entryPath)) {
        // See https://nodejs.org/api/packages.html#packages_community_conditions_definitions
        switch (currentKey) {
          case "import": {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode,
              module: "esmodule",
              entryPath: output,
            });
            break;
          }
          case "require": {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode,
              module: "commonjs",
              entryPath: output,
            });
            break;
          }
          case "types": {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode,
              module: "dts",
              entryPath: output,
            });
            break;
          }
          case "node": {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform: "node",
              mode,
              module,
              entryPath: output,
            });
            break;
          }
          case "deno": {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform: "deno",
              mode,
              module,
              entryPath: output,
            });
            break;
          }
          case "browser": {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform: "browser",
              mode,
              module,
              entryPath: output,
            });
            break;
          }
          case "development": {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode: "development",
              module,
              entryPath: output,
            });
            break;
          }
          case "production": {
            addConditionalEntry({
              key: `${parentKey}.${currentKey}`,
              parentKey: `${parentKey}.${currentKey}`,
              platform,
              mode: "production",
              module,
              entryPath: output,
            });
            break;
          }
          case ".": {
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
            if (currentKey.startsWith("./")) {
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

  if (manifest.exports) {
    addConditionalEntry({
      key: "exports",
      parentKey: "exports",
      platform: defaultPlatform,
      mode: "production",
      module: defaultModule,
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
