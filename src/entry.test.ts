import * as path from 'node:path';
import {
  describe,
  test,
  expect,
  vi,
} from 'vitest';

import { type Flags } from './cli';
import { type Manifest } from './manifest';
import { type Entry } from './entry';
import { type Reporter } from './reporter';
import { parseConfig } from './context';
import { getEntriesFromContext } from "./entry";
import * as formatUtils from './formatUtils';

const resolve = (cwd: string, to: string) => path.join(cwd, to);

class ViReporter implements Reporter {
  debug = vi.fn();
  info = vi.fn();
  warn = vi.fn();
  error = vi.fn();
  captureException = vi.fn();
  createChildReporter() {
    return new ViReporter();
  }
}

const defaultTargets: string[] = [
  'chrome',
  'firefox',
  'safari',
];

describe('getEntriesFromContext', () => {
  const defaultFlags: Flags = {
    cwd: '/project',
    clean: false,
    verbose: false,
    rootDir: undefined,
    outDir: undefined,
    tsconfig: 'tsconfig.json',
    importMaps: 'package.json',
    external: [],
    jsx: undefined,
    jsxFactory: undefined,
    jsxFragment: undefined,
    jsxImportSource: undefined,
    standalone: false,
    sourcemap: true,
    dts: false,
    platform: undefined,
  };

  const getEntriesFromManifest = (manifest: Manifest) => {
    const reporter = new ViReporter();
    const context = parseConfig({
      flags: defaultFlags,
      targets: defaultTargets,
      manifest,
      reporter,
      resolve,
    });
    return {
      context,
      reporter,
      getEntries: () => getEntriesFromContext({
        context,
        resolve,
        reporter,
      }),
    };
  };

  test('empty package', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
    });
    expect(getEntries()).toEqual<Entry[]>([]);
    expect(reporter.warn).not.toHaveBeenCalled();
  });

  test('main entry, implicit commonjs', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      main: './lib/index.js',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test('main field, explicit commonjs', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      type: 'commonjs',
      main: './lib/index.js',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test('main field, explicit esmodule', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      type: 'module',
      main: './lib/index.js',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "esmodule",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test('main field with module extension - module/cjs', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      type: 'module',
      main: './lib/index.cjs',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.cjs",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.cjs",
      },
    ]);
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test('main field with module extension - commonjs/mjs', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      type: 'commonjs',
      main: './lib/index.mjs',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "esmodule",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.mjs",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.mjs",
      },
    ]);
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test('main field accepts json', () => {
    const { getEntries } = getEntriesFromManifest({
      name: 'my-package',
      main: './lib/index.json',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "file",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.json",
        sourceFile: ["/project/src/index.json"],
        outputFile: "/project/lib/index.json",
      },
    ]);
  });

  test('main field accepts node addon', () => {
    const { getEntries } = getEntriesFromManifest({
      name: 'my-package',
      main: './lib/index.node',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "file",
        mode: undefined,
        minify: false,
        sourcemap: true,
        entryPath: "./lib/index.node",
        platform: "node",
        sourceFile: ["/project/src/index.node"],
        outputFile: "/project/lib/index.node",
      },
    ]);
  });

  test('main field treat unknown extensions as a js file', () => {
    const { getEntries } = getEntriesFromManifest({
      name: 'my-package',
      main: './lib/index.css',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        entryPath: "./lib/index.css",
        platform: "neutral",
        sourceFile: [
          "/project/src/index.css.cjs",
          "/project/src/index.css.js",
          "/project/src/index.css",
        ],
        outputFile: "/project/lib/index.css",
      },
    ]);
  });

  test('module field', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      main: './lib/main.js',
      module: './lib/module.js',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "main",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/main.js",
        sourceFile: ["/project/src/main.cjs", "/project/src/main.js"],
        outputFile: "/project/lib/main.js",
      },
      {
        key: "module",
        module: "esmodule",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/module.js",
        sourceFile: ["/project/src/module.mjs", "/project/src/module.js"],
        outputFile: "/project/lib/module.js",
      },
    ]);
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `${formatUtils.key('module')} field is not standard and may works in only legacy bundlers.`,
      ),
    );
  });

  test('throw if "main" and "module" is on conflict', () => {
    const { getEntries } = getEntriesFromManifest({
      name: 'my-package',
      main: './lib/index.js',
      module: './lib/index.js',
    });
    expect(getEntries).toThrowErrorMatchingSnapshot();
  });

  test('prefer "exports" over "module" on conflict', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      exports: './lib/index.js',
      module: './lib/index.js',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "exports",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Entry ${formatUtils.key('module')} will be ignored since`,
      ),
    );
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `${formatUtils.key('module')} field is not standard and may works in only legacy bundlers.`,
      ),
    );
  });

  test('exports field', () => {
    const { getEntries } = getEntriesFromManifest({
      name: 'my-package',
      exports: './lib/index.js',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "exports",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
  });

  test('exports field always precedense over main #1', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      main: './lib/index.js',
      exports: './lib/index.js',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "exports",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
    expect(reporter.warn).not.toHaveBeenCalled();
  });

  test('exports field always precedense over main #2', () => {
    const { getEntries, reporter } = getEntriesFromManifest({
      name: 'my-package',
      type: 'module',
      main: './lib/index.js',
      exports: {
        require: './lib/index.js',
      },
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: "exports.require",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
    expect(reporter.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Entry ${formatUtils.key('main')} will be ignored since`,
      ),
    );
  });

  test('conditional exports', () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        exports: {
          require: "./lib/require.js",
          import: "./lib/import.js",
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: "exports.require",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/require.js",
        sourceFile: ["/project/src/require.cjs", "/project/src/require.js"],
        outputFile: "/project/lib/require.js",
      },
      {
        key: "exports.import",
        module: "esmodule",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/import.js",
        sourceFile: ["/project/src/import.mjs", "/project/src/import.js"],
        outputFile: "/project/lib/import.js",
      },
    ]);

    expect(
      getEntriesFromManifest({
        name: "my-package",
        exports: {
          ".": "./lib/index.js",
          "./index": "./lib/index.js",
          "./index.js": "./lib/index.js",
          "./feature": "./lib/feature/index.js",
          "./feature/index.js": "./lib/feature/index.js",
          "./package.json": "./package.json",
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."]',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
      {
        key: 'exports["./feature"]',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/feature/index.js",
        sourceFile: [
          "/project/src/feature/index.cjs",
          "/project/src/feature/index.js",
        ],
        outputFile: "/project/lib/feature/index.js",
      },
      {
        key: 'exports["./package.json"]',
        module: "file",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./package.json",
        sourceFile: ["/project/package.json"],
        outputFile: "/project/package.json",
      },
    ]);
  });

  test("nested conditional exports", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        exports: {
          ".": {
            require: "./lib/index.cjs",
            import: "./lib/index.js",
          },
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].require',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.cjs",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.cjs",
      },
      {
        key: 'exports["."].import',
        module: "esmodule",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
  });

  test("conditional exports community definitions", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        exports: {
          ".": {
            node: {
              require: "./lib/index.cjs",
              import: {
                development: "./lib/index.mjs",
                production: "./lib/index.min.mjs",
              },
            },
            browser: {
              development: "./lib/browser.js",
              production: "./lib/browser.min.js",
            },
          },

          // reversed exports map
          deno: {
            "./deno": "./lib/deno.js",
          },
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].node.require',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "node",
        entryPath: "./lib/index.cjs",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.cjs",
      },
      {
        key: 'exports["."].node.import.development',
        module: "esmodule",
        mode: "development",
        minify: false,
        sourcemap: true,
        platform: "node",
        entryPath: "./lib/index.mjs",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.mjs",
      },
      {
        key: 'exports["."].node.import.production',
        module: "esmodule",
        mode: "production",
        minify: true,
        sourcemap: true,
        platform: "node",
        entryPath: "./lib/index.min.mjs",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.min.mjs",
      },

      // Browsers don't support CommonJS.
      // However, Node.js tool users may have their own bundler.
      //
      // It shouldn't be recommended
      {
        key: 'exports["."].browser.development',

        module: "commonjs",
        mode: "development",
        minify: false,
        sourcemap: true,
        platform: "browser",
        entryPath: "./lib/browser.js",
        sourceFile: ["/project/src/browser.cjs", "/project/src/browser.js"],
        outputFile: "/project/lib/browser.js",
      },

      // Using some popular extension patterns like `*.min.js` can be inferred as regular extension.
      {
        key: 'exports["."].browser.production',
        module: "commonjs",
        mode: "production",
        minify: true,
        sourcemap: true,
        platform: "browser",
        entryPath: "./lib/browser.min.js",
        sourceFile: ["/project/src/browser.cjs", "/project/src/browser.js"],
        outputFile: "/project/lib/browser.min.js",
      },

      // Deno only supports ESM.
      // However, Deno users can load CommonJS module using compat API (https://deno.land/std/node/module.ts) if they really want.
      // See https://deno.land/manual/npm_nodejs/std_node
      //
      // It shouldn't be recommended anyway
      {
        key: 'exports.deno["./deno"]',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "deno",
        entryPath: "./lib/deno.js",
        sourceFile: ["/project/src/deno.cjs", "/project/src/deno.js"],
        outputFile: "/project/lib/deno.js",
      },
    ]);
  });

  test('bin entry', () => {
    const { getEntries } = getEntriesFromManifest({
      name: 'my-package',
      bin: './lib/bin.js',
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: 'bin',
        module: 'commonjs',
        mode: undefined,
        minify: false,
        sourcemap: false,
        platform: 'node',
        entryPath: './lib/bin.js',
        sourceFile: [
          '/project/src/bin.cjs',
          '/project/src/bin.js',
        ],
        outputFile: '/project/lib/bin.js',
      },
    ]);
  });

  test('bin entry only accepts js', () => {
    const { getEntries } = getEntriesFromManifest({
      name: 'my-package',
      bin: './lib/index.json',
    });
    expect(getEntries).toThrowErrorMatchingSnapshot();
  });

  test('multiple bin entries', () => {
    const { getEntries } = getEntriesFromManifest({
      name: 'my-package',
      type: 'module',
      bin: {
        command1: './lib/command.js',
        command2: './lib/command.cjs',
        command3: './lib/command.mjs',
      },
    });
    expect(getEntries()).toEqual<Entry[]>([
      {
        key: 'bin["command1"]',
        module: 'esmodule',
        mode: undefined,
        minify: false,
        sourcemap: false,
        platform: 'node',
        entryPath: './lib/command.js',
        sourceFile: [
          '/project/src/command.mjs',
          '/project/src/command.js',
        ],
        outputFile: '/project/lib/command.js',
      },
      {
        key: 'bin["command2"]',
        module: 'commonjs',
        mode: undefined,
        minify: false,
        sourcemap: false,
        platform: 'node',
        entryPath: './lib/command.cjs',
        sourceFile: [
          '/project/src/command.cjs',
          '/project/src/command.js',
        ],
        outputFile: '/project/lib/command.cjs',
      },
      {
        key: 'bin["command3"]',
        module: 'esmodule',
        mode: undefined,
        minify: false,
        sourcemap: false,
        platform: 'node',
        entryPath: './lib/command.mjs',
        sourceFile: [
          '/project/src/command.mjs',
          '/project/src/command.js',
        ],
        outputFile: '/project/lib/command.mjs',
      },
    ]);
  });

  describe('getEntriesFromContext - when rootDir=./src, outDir=.', () => {
    const getEntriesFromManifest = (manifest: Manifest) => {
      const defaultFlags: Flags = {
        cwd: '/project',
        clean: false,
        verbose: false,
        rootDir: 'src',
        outDir: '.',
        tsconfig: 'tsconfig.json',
        importMaps: 'package.json',
        external: [],
        jsx: undefined,
        jsxFactory: undefined,
        jsxFragment: undefined,
        jsxImportSource: undefined,
        standalone: false,
        sourcemap: true,
        dts: false,
        platform: undefined,
      };
      const reporter = new ViReporter();
      const context = parseConfig({
        flags: defaultFlags,
        targets: defaultTargets,
        manifest,
        reporter,
        resolve,
      });
      const getEntries = () => getEntriesFromContext({
        context,
        resolve,
        reporter,
      });
      return { getEntries, context, reporter };
    };

    test('conditional exports', () => {
      expect(
        getEntriesFromManifest({
          name: 'my-package',
          exports: {
            require: './require.js',
            import: './import.js',
          },
        }).getEntries(),
      ).toEqual<Entry[]>([
        {
          key: 'exports.require',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './require.js',
          sourceFile: [
            '/project/src/require.cjs',
            '/project/src/require.js',
          ],
          outputFile: '/project/require.js',
        },
        {
          key: 'exports.import',
          module: 'esmodule',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './import.js',
          sourceFile: [
            '/project/src/import.mjs',
            '/project/src/import.js',
          ],
          outputFile: '/project/import.js',
        },
      ]);

      expect(
        getEntriesFromManifest({
          name: 'my-package',
          exports: {
            '.': './index.js',
            './index': './index.js',
            './index.js': './index.js',
            './feature': './feature/index.js',
            './feature/index.js': './feature/index.js',
            './package.json': './package.json',
          },
        }).getEntries(),
      ).toEqual<Entry[]>([
        {
          key: 'exports["."]',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './index.js',
          sourceFile: [
            '/project/src/index.cjs',
            '/project/src/index.js',
          ],
          outputFile: '/project/index.js',
        },
        {
          key: 'exports["./feature"]',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './feature/index.js',
          sourceFile: [
            '/project/src/feature/index.cjs',
            '/project/src/feature/index.js',
          ],
          outputFile: '/project/feature/index.js',
        },
        {
          key: 'exports["./package.json"]',
          module: 'file',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './package.json',
          sourceFile: ['/project/package.json'],
          outputFile: '/project/package.json',
        },
      ]);
    });
  });

  describe('getEntriesFromContext - when rootDir=., outDir=./lib', () => {
    const getEntriesFromManifest = (manifest: Manifest) => {
      const reporter = new ViReporter();
      const context = parseConfig({
        flags: {
          ...defaultFlags,
          rootDir: '.',
          outDir: 'lib',
        },
        targets: defaultTargets,
        manifest,
        reporter,
        resolve,
      });
      const getEntries = () => getEntriesFromContext({
        context,
        resolve,
        reporter,
      });
      return { getEntries, context, reporter };
    };

    test('conditional exports', () => {
      expect(
        getEntriesFromManifest({
          name: 'my-package',
          exports: {
            require: './lib/require.js',
            import: './lib/import.js',
          },
        }).getEntries(),
      ).toEqual<Entry[]>([
        {
          key: 'exports.require',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/require.js',
          sourceFile: [
            '/project/require.cjs',
            '/project/require.js',
          ],
          outputFile: '/project/lib/require.js',
        },
        {
          key: 'exports.import',
          module: 'esmodule',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/import.js',
          sourceFile: [
            '/project/import.mjs',
            '/project/import.js',
          ],
          outputFile: '/project/lib/import.js',
        },
      ]);

      expect(
        getEntriesFromManifest({
          name: 'my-package',
          exports: {
            '.': './lib/index.js',
            './index': './lib/index.js',
            './index.js': './lib/index.js',
            './feature': './lib/feature/index.js',
            './feature/index.js': './lib/feature/index.js',
            './package.json': './package.json',
          },
        }).getEntries(),
      ).toEqual<Entry[]>([
        {
          key: 'exports["."]',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.js',
          sourceFile: [
            '/project/index.cjs',
            '/project/index.js',
          ],
          outputFile: '/project/lib/index.js',
        },
        {
          key: 'exports["./feature"]',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/feature/index.js',
          sourceFile: [
            '/project/feature/index.cjs',
            '/project/feature/index.js',
          ],
          outputFile: '/project/lib/feature/index.js',
        },
        {
          key: 'exports["./package.json"]',
          module: 'file',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './package.json',
          sourceFile: ['/project/package.json'],
          outputFile: '/project/package.json',
        },
      ]);
    });
  });

  describe('getEntriesFromContext - jsx=preserve', () => {
    const getEntriesFromManifest = (manifest: Manifest) => {
      const reporter = new ViReporter();
      const context = parseConfig({
        flags: {
          ...defaultFlags,
          jsx: 'preserve',
        },
        targets: defaultTargets,
        manifest,
        reporter,
        resolve,
      });
      const getEntries = () => getEntriesFromContext({
        context,
        resolve,
        reporter,
      });
      return { getEntries, context, reporter };
    };

    test('conditional exports', () => {
      expect(
        getEntriesFromManifest({
          name: 'my-package',
          exports: {
            require: './lib/index.cjs',
            import: './lib/index.mjs',
          },
        }).getEntries(),
      ).toEqual<Entry[]>([
        {
          key: 'exports.require',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.cjs',
          sourceFile: [
            '/project/src/index.cjsx',
            '/project/src/index.jsx',
            '/project/src/index.cjs',
            '/project/src/index.js',
          ],
          outputFile: '/project/lib/index.cjs',
        },
        {
          key: 'exports.import',
          module: 'esmodule',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.mjs',
          sourceFile: [
            '/project/src/index.mjsx',
            '/project/src/index.jsx',
            '/project/src/index.mjs',
            '/project/src/index.js',
          ],
          outputFile: '/project/lib/index.mjs',
        },
      ]);
    });
  });
});

describe('getEntriesFromContext - in TypeScript project', () => {
  const defaultFlags: Flags = {
    cwd: '/project',
    clean: false,
    verbose: false,
    rootDir: undefined,
    outDir: undefined,
    tsconfig: 'tsconfig.json',
    importMaps: 'package.json',
    external: [],
    jsx: undefined,
    jsxFactory: undefined,
    jsxFragment: undefined,
    jsxImportSource: undefined,
    standalone: false,
    sourcemap: true,
    dts: true,
    platform: undefined,
  };

  const getEntriesFromManifest = (manifest: Manifest) => {
    const reporter = new ViReporter();
    const context = parseConfig({
      flags: defaultFlags,
      targets: defaultTargets,
      manifest,
      reporter,
      resolve,
      tsconfigPath: 'tsconfig.json',
      tsconfig: {},
    });
    const getEntries = () => getEntriesFromContext({
      context,
      resolve,
      reporter,
    });
    return { getEntries, context, reporter };
  };

  test('types entry in root manifest', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        main: './lib/index.js',
        module: './lib/index.mjs',
        types: './lib/index.d.ts',
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.js',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.cjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.js',
      },
      {
        key: 'module',
        module: 'esmodule',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.mjs',
        sourceFile: [
          '/project/src/index.mts',
          '/project/src/index.mjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.mjs',
      },
      {
        key: 'types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.d.ts',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.ts',
      },
    ]);
  });

  test('conditional exports', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        exports: {
          '.': {
            types: './lib/index.d.ts',
            require: './lib/index.cjs',
            import: './lib/index.mjs',
          },
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.d.ts',
        sourceFile: [
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.ts',
      },
      {
        key: 'exports["."].require',
        module: 'commonjs',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.cjs',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.cjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.cjs',
      },
      {
        key: 'exports["."].import',
        module: 'esmodule',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.mjs',
        sourceFile: [
          '/project/src/index.mts',
          '/project/src/index.mjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.mjs',
      },
    ]);
  });

  test('types entry must has .d.ts extension', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        types: './lib/index.ts',
      }).getEntries,
    ).toThrowErrorMatchingSnapshot();
  });

  test('types entry must occur first in conditional exports', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        exports: {
          '.': {
            require: './lib/index.cjs',
            // This must occur first.
            types: './lib/index.d.ts',
            import: './lib/index.mjs',
          },
        },
      }).getEntries,
    ).toThrowErrorMatchingSnapshot();
  });

  test('explicit & implicit types entry', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        type: 'module',
        exports: {
          '.': {
            types: './lib/index.d.ts',
            require: {
              development: './lib/index.cjs',
              production: './lib/index.min.cjs',
            },
          },
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.d.ts',
        sourceFile: [
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.ts',
      },
      {
        key: 'exports["."].require.types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.d.cts',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.cts',
      },
      {
        key: 'exports["."].require.development',
        module: 'commonjs',
        mode: 'development',
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.cjs',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.cjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.cjs',
      },
      {
        key: 'exports["."].require.production',
        module: 'commonjs',
        mode: 'production',
        minify: true,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.min.cjs',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.cjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.min.cjs',
      },
    ]);
  });

  test('implicit types from default entry', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        type: 'module',
        exports: {
          '.': {
            require: {
              development: './lib/index.cjs',
              production: './lib/index.min.cjs',
            },
            default: './lib/index.js',
          },
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.d.ts',
        sourceFile: [
          '/project/src/index.mts',
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.ts',
      },
      {
        key: 'exports["."].require.types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.d.cts',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.cts',
      },
      {
        key: 'exports["."].require.development',
        module: 'commonjs',
        mode: 'development',
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.cjs',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.cjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.cjs',
      },
      {
        key: 'exports["."].require.production',
        module: 'commonjs',
        mode: 'production',
        minify: true,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.min.cjs',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.cjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.min.cjs',
      },
      {
        key: 'exports["."].default',
        module: 'esmodule',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.js',
        sourceFile: [
          '/project/src/index.mts',
          '/project/src/index.mjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.js',
      },
    ]);
  });

  test('implicit types from other entries', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        type: 'module',
        exports: {
          '.': {
            require: {
              development: './lib/index.cjs',
              production: './lib/index.min.cjs',
            },
            import: {
              development: './lib/index.mjs',
              production: './lib/index.min.mjs',

              node: {
                default: './lib/index.node.js',
              },
            },
          },
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].require.types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.d.cts',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.cts',
      },
      {
        key: 'exports["."].require.development',
        module: 'commonjs',
        mode: 'development',
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.cjs',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.cjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.cjs',
      },
      {
        key: 'exports["."].require.production',
        module: 'commonjs',
        mode: 'production',
        minify: true,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.min.cjs',
        sourceFile: [
          '/project/src/index.cts',
          '/project/src/index.cjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.min.cjs',
      },
      {
        key: 'exports["."].import.types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.d.mts',
        sourceFile: [
          '/project/src/index.mts',
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.mts',
      },
      {
        key: 'exports["."].import.development',
        module: 'esmodule',
        mode: 'development',
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.mjs',
        sourceFile: [
          '/project/src/index.mts',
          '/project/src/index.mjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.mjs',
      },
      {
        key: 'exports["."].import.production',
        module: 'esmodule',
        mode: 'production',
        minify: true,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.min.mjs',
        sourceFile: [
          '/project/src/index.mts',
          '/project/src/index.mjs',
          '/project/src/index.ts',
          '/project/src/index.js',
        ],
        outputFile: '/project/lib/index.min.mjs',
      },
      {
        key: 'exports["."].import.node.types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'node',
        entryPath: './lib/index.node.d.ts',
        sourceFile: [
          '/project/src/index.node.mts',
          '/project/src/index.node.ts',
        ],
        outputFile: '/project/lib/index.node.d.ts',
      },
      {
        key: 'exports["."].import.node.default',
        module: 'esmodule',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'node',
        entryPath: './lib/index.node.js',
        sourceFile: [
          '/project/src/index.node.mts',
          '/project/src/index.node.mjs',
          '/project/src/index.node.ts',
          '/project/src/index.node.js',
        ],
        outputFile: '/project/lib/index.node.js',
      },
    ]);
  });

  test('types entry does not accept nesting', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        exports: {
          '.': {
            types: {
              default: './lib/index.d.ts',
            },
            require: './lib/index.cjs',
            import: './lib/index.mjs',
          },
        },
      }).getEntries,
    ).toThrowErrorMatchingSnapshot();
  });

  describe('getEntriesFromContext - when rootDir=outDir=.', () => {
    const getEntriesFromManifest = (manifest: Manifest) => {
      const reporter = new ViReporter();
      const context = parseConfig({
        flags: defaultFlags,
        targets: defaultTargets,
        manifest,
        reporter,
        resolve,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          compilerOptions: {
            rootDir: '.',
            outDir: '.',
          },
        },
      });
      const getEntries = () => getEntriesFromContext({
        context,
        resolve,
        reporter,
      });
      return { getEntries, context, reporter };
    };

    test('conditional exports', () => {
      expect(
        getEntriesFromManifest({
          name: 'my-package',
          exports: {
            '.': {
              types: './index.d.ts',
              require: './index.cjs',
              import: './index.mjs',
            },
          },
        }).getEntries(),
      ).toEqual<Entry[]>([
        {
          key: 'exports["."].types',
          module: 'dts',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './index.d.ts',
          sourceFile: [
            '/project/index.ts',
          ],
          outputFile: '/project/index.d.ts',
        },
        {
          key: 'exports["."].require',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './index.cjs',
          sourceFile: [
            '/project/index.cts',
            '/project/index.ts',
          ],
          outputFile: '/project/index.cjs',
        },
        {
          key: 'exports["."].import',
          module: 'esmodule',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './index.mjs',
          sourceFile: [
            '/project/index.mts',
            '/project/index.ts',
          ],
          outputFile: '/project/index.mjs',
        },
      ]);
    });
  });

  describe('getEntriesFromContext - when jsx=preserve', () => {
    const getEntriesFromManifest = (manifest: Manifest) => {
      const reporter = new ViReporter();
      const context = parseConfig({
        flags: defaultFlags,
        targets: defaultTargets,
        manifest,
        reporter,
        resolve,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          compilerOptions: {
            jsx: 'preserve',
          },
        },
      });
      const getEntries = () => getEntriesFromContext({
        context,
        resolve,
        reporter,
      });
      return { getEntries, context, reporter };
    };

    test('allow jsx entries', () => {
      expect(
        getEntriesFromManifest({
          name: 'my-package',
          exports: {
            '.': {
              require: './lib/index.cjsx',
              import: './lib/index.mjsx',
              default: './lib/index.jsx',
            },
          },
        }).getEntries(),
      ).toEqual<Entry[]>([
        {
          key: 'exports["."].types',
          module: 'dts',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.d.ts',
          sourceFile: [
            '/project/src/index.ctsx',
            '/project/src/index.tsx',
            '/project/src/index.cts',
            '/project/src/index.ts',
          ],
          outputFile: '/project/lib/index.d.ts',
        },
        {
          key: 'exports["."].require',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.cjsx',
          sourceFile: [
            '/project/src/index.ctsx',
            '/project/src/index.cjsx',
            '/project/src/index.tsx',
            '/project/src/index.jsx',
            '/project/src/index.cts',
            '/project/src/index.cjs',
            '/project/src/index.ts',
            '/project/src/index.js',
          ],
          outputFile: '/project/lib/index.cjsx',
        },
        {
          key: 'exports["."].import',
          module: 'esmodule',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.mjsx',
          sourceFile: [
            '/project/src/index.mtsx',
            '/project/src/index.mjsx',
            '/project/src/index.tsx',
            '/project/src/index.jsx',
            '/project/src/index.mts',
            '/project/src/index.mjs',
            '/project/src/index.ts',
            '/project/src/index.js',
          ],
          outputFile: '/project/lib/index.mjsx',
        },
        {
          key: 'exports["."].default',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.jsx',
          sourceFile: [
            '/project/src/index.ctsx',
            '/project/src/index.cjsx',
            '/project/src/index.tsx',
            '/project/src/index.jsx',
            '/project/src/index.cts',
            '/project/src/index.cjs',
            '/project/src/index.ts',
            '/project/src/index.js',
          ],
          outputFile: '/project/lib/index.jsx',
        },
      ]);
    });

    test('conditional exports', () => {
      expect(
        getEntriesFromManifest({
          name: 'my-package',
          exports: {
            '.': {
              types: './lib/index.d.ts',
              require: './lib/index.cjs',
              import: './lib/index.mjs',
            },
          },
        }).getEntries(),
      ).toEqual<Entry[]>([
        {
          key: 'exports["."].types',
          module: 'dts',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.d.ts',
          sourceFile: [
            '/project/src/index.tsx',
            '/project/src/index.ts',
          ],
          outputFile: '/project/lib/index.d.ts',
        },
        {
          key: 'exports["."].require',
          module: 'commonjs',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.cjs',
          sourceFile: [
            '/project/src/index.ctsx',
            '/project/src/index.cjsx',
            '/project/src/index.tsx',
            '/project/src/index.jsx',
            '/project/src/index.cts',
            '/project/src/index.cjs',
            '/project/src/index.ts',
            '/project/src/index.js',
          ],
          outputFile: '/project/lib/index.cjs',
        },
        {
          key: 'exports["."].import',
          module: 'esmodule',
          mode: undefined,
          minify: false,
          sourcemap: true,
          platform: 'neutral',
          entryPath: './lib/index.mjs',
          sourceFile: [
            '/project/src/index.mtsx',
            '/project/src/index.mjsx',
            '/project/src/index.tsx',
            '/project/src/index.jsx',
            '/project/src/index.mts',
            '/project/src/index.mjs',
            '/project/src/index.ts',
            '/project/src/index.js',
          ],
          outputFile: '/project/lib/index.mjs',
        },
      ]);
    });
  });
});

describe('common usecases', () => {
  const defaultFlags: Flags = {
    cwd: '/project',
    clean: false,
    verbose: false,
    rootDir: 'src',
    outDir: 'lib',
    tsconfig: 'tsconfig.json',
    importMaps: 'package.json',
    external: [],
    jsx: undefined,
    jsxFactory: undefined,
    jsxFragment: undefined,
    jsxImportSource: undefined,
    standalone: false,
    sourcemap: true,
    dts: true,
    platform: undefined,
  };

  const getEntriesFromManifest = (manifest: Manifest) => {
    const reporter = new ViReporter();
    const context = parseConfig({
      flags: defaultFlags,
      targets: defaultTargets,
      manifest,
      reporter,
      resolve,
      tsconfigPath: 'tsconfig.json',
      tsconfig: {},
    });
    const getEntries = () => getEntriesFromContext({
      context,
      resolve,
      reporter,
    });
    return { getEntries, context, reporter };
  };

  test('server client entries', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',

        exports: {
          '.': {
            types: './client.d.ts',
            require: './client.min.js',
            import: './client.min.mjs',
          },
          './server': {
            types: './server.d.ts',
            require: './server.js',
            import: './server.mjs',
          },
          './package.json': './package.json',
        },
      }).getEntries(),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './client.d.ts',
        sourceFile: [
          '/project/client.ts',
        ],
        outputFile: '/project/client.d.ts',
      },
      {
        key: 'exports["."].require',
        module: 'commonjs',
        mode: undefined,
        minify: true,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './client.min.js',
        sourceFile: [
          '/project/client.cts',
          '/project/client.cjs',
          '/project/client.ts',
          '/project/client.js',
        ],
        outputFile: '/project/client.min.js',
      },
      {
        key: 'exports["."].import',
        module: 'esmodule',
        mode: undefined,
        minify: true,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './client.min.mjs',
        sourceFile: [
          '/project/client.mts',
          '/project/client.mjs',
          '/project/client.ts',
          '/project/client.js',
        ],
        outputFile: '/project/client.min.mjs',
      },
      {
        key: 'exports["./server"].types',
        module: 'dts',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './server.d.ts',
        sourceFile: [
          '/project/server.ts',
        ],
        outputFile: '/project/server.d.ts',
      },
      {
        key: 'exports["./server"].require',
        module: 'commonjs',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './server.js',
        sourceFile: [
          '/project/server.cts',
          '/project/server.cjs',
          '/project/server.ts',
          '/project/server.js',
        ],
        outputFile: '/project/server.js',
      },
      {
        key: 'exports["./server"].import',
        module: 'esmodule',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './server.mjs',
        sourceFile: [
          '/project/server.mts',
          '/project/server.mjs',
          '/project/server.ts',
          '/project/server.js',
        ],
        outputFile: '/project/server.mjs',
      },
      {
        key: 'exports["./package.json"]',
        module: 'file',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './package.json',
        sourceFile: [
          '/project/package.json',
        ],
        outputFile: '/project/package.json',
      },
    ]);
  });
});
