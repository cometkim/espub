import * as path from 'node:path';
import {
  describe,
  afterEach,
  test,
  expect,
  vi,
} from 'vitest';

import { type Flags } from './cli';
import { type Manifest } from './manifest';
import { type Entry } from './entry';
import { Reporter } from './reporter';
import { parseConfig } from './context';
import { getEntriesFromContext } from "./entry";
import * as formatUtils from './formatUtils';

const resolve = (cwd: string, to: string) => path.join(cwd, to);

const defaultTargets: string[] = [
  'chrome',
  'firefox',
  'safari',
];

describe('getEntriesFromContext', () => {
  const defaultFlags: Flags = {
    cwd: '/project',
    rootDir: undefined,
    outDir: undefined,
    tsconfig: 'tsconfig.json',
    importMaps: 'package.json',
    external: [],
    standalone: false,
    noMinify: false,
    noSourcemap: false,
    noDts: true,
    platform: undefined,
  };

  const reporter = new Reporter(console);

  const info = vi.spyOn(reporter, 'info');
  const warn = vi.spyOn(reporter, 'warn');
  const error = vi.spyOn(reporter, 'error');
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getEntriesFromManifest = (manifest: Manifest) => {
    const context = parseConfig({
      flags: defaultFlags,
      targets: defaultTargets,
      manifest,
      reporter,
      resolve,
    });
    return getEntriesFromContext({
      context,
      resolve,
      reporter,
    });
  };

  test("empty package", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
      }),
    ).toEqual([]);

    expect(warn).not.toHaveBeenCalled();
  });

  test("main entry, implicit commonjs", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        main: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test("main field, explicit commonjs", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        type: "commonjs",
        main: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test("main field, explicit esmodule", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        type: "module",
        main: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test("main field with module extension", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        type: "module",
        main: "./lib/index.cjs",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );

    expect(
      getEntriesFromManifest({
        name: "my-package",
        type: "commonjs",
        main: "./lib/index.mjs",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test("main field accepts js, json, node addon entryPaths", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        main: "./lib/index.json",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );

    expect(
      getEntriesFromManifest({
        name: "my-package",
        main: "./lib/index.node",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );

    // otherwise treated as JavaScript text
    expect(
      getEntriesFromManifest({
        name: "my-package",
        main: "./lib/index.css",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining(
        `Using ${formatUtils.key('exports')} field is highly recommended.`,
      ),
    );
  });

  test("module field", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        main: "./lib/main.js",
        module: "./lib/module.js",
      }),
    ).toEqual<Entry[]>([
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

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(
        `${formatUtils.key('module')} field is not standard and may works in only legacy bundlers.`,
      ),
    );
  });

  test('throw if "main" and "module" is on conflict', () => {
    expect(
      () => getEntriesFromManifest({
        name: "my-package",
        main: "./lib/index.js",
        module: "./lib/index.js",
      })
    ).toThrowError();

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(
        `Conflict found for ${formatUtils.path('./lib/index.js')}`,
      ),
    );
  });

  test('prefer "exports" over "module" on conflict', () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        exports: "./lib/index.js",
        module: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
      {
        key: "exports",
        module: "commonjs",
        mode: "production",
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);

    expect(warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        `Entry ${formatUtils.key('module')} will be ignored since`,
      ),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );

    expect(warn).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        `${formatUtils.key('module')} field is not standard and may works in only legacy bundlers.`,
      ),
    );
  });

  test("exports field", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        exports: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
      {
        key: "exports",
        module: "commonjs",
        mode: "production",
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
  });

  test("exports field always precedense over main", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        main: "./lib/index.js",
        exports: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
      {
        key: "exports",
        module: "commonjs",
        mode: "production",
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);

    expect(warn).not.toHaveBeenCalled();

    expect(
      getEntriesFromManifest({
        name: "my-package",
        type: "module",
        main: "./lib/index.js",
        exports: {
          require: "./lib/index.js",
        },
      }),
    ).toEqual<Entry[]>([
      {
        key: "exports.require",
        module: "commonjs",
        mode: "production",
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);

    expect(warn).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(
        `Entry ${formatUtils.key('main')} will be ignored since`,
      ),
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  test("conditional exports", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        exports: {
          require: "./lib/require.js",
          import: "./lib/import.js",
        },
      }),
    ).toEqual<Entry[]>([
      {
        key: "exports.require",
        module: "commonjs",
        mode: "production",
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
        mode: "production",
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
      }),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."]',
        module: "commonjs",
        mode: "production",
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
        mode: "production",
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
        mode: "production",
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
      }),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].require',
        module: "commonjs",
        mode: "production",
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
        mode: "production",
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
      }),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].node.require',
        module: "commonjs",
        mode: "production",
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
        mode: "production",
        minify: false,
        sourcemap: true,
        platform: "deno",
        entryPath: "./lib/deno.js",
        sourceFile: ["/project/src/deno.cjs", "/project/src/deno.js"],
        outputFile: "/project/lib/deno.js",
      },
    ]);
  });

  describe.todo("when rootDir=./src, outDir=.");
  describe.todo("when rootDir=., outDir=./lib");
  describe.todo("when rootDir=outDir=.");
  describe.todo("when rootDir=outDir=./lib");
  describe.todo("when rootDir=outDir=./lib & TypeScript sources");
});

describe('getEntriesFromContext - in TypeScript project', () => {
  const defaultFlags: Flags = {
    cwd: '/project',
    rootDir: undefined,
    outDir: undefined,
    tsconfig: 'tsconfig.json',
    importMaps: 'package.json',
    external: [],
    standalone: false,
    noMinify: false,
    noSourcemap: false,
    noDts: false,
    platform: undefined,
  };

  const reporter = new Reporter(console);

  const info = vi.spyOn(reporter, 'info');
  const warn = vi.spyOn(reporter, 'warn');
  const error = vi.spyOn(reporter, 'error');
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const getEntriesFromManifest = (manifest: Manifest) => {
    const context = parseConfig({
      flags: defaultFlags,
      targets: defaultTargets,
      manifest,
      reporter,
      resolve,
      tsconfig: {},
    });
    return getEntriesFromContext({
      context,
      resolve,
      reporter,
    });
  };

  test('types entry in root manifest', () => {
    expect(
      getEntriesFromManifest({
        name: 'my-package',
        main: './lib/index.js',
        module: './lib/index.mjs',
        types: './lib/index.d.ts',
      }),
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
          '/project/src/index.mts',
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
      }),
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
          '/project/src/index.cts',
          '/project/src/index.mts',
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
    expect(() =>
      getEntriesFromManifest({
        name: 'my-package',
        types: './lib/index.ts',
      }),
    ).toThrowErrorMatchingSnapshot();
  });

  test('types entry must occur first in conditional exports', () => {
    expect(() =>
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
      }),
    ).toThrowErrorMatchingSnapshot();
  });

  test('explicit types entry', () => {
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
      }),
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
        outputFile: '/project/lib/index.js',
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
      }),
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
      }),
    ).toEqual<Entry[]>([
      {
        key: 'exports["."].require.types',
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
        entryPath: './lib/index.d.ts',
        sourceFile: [
          '/project/src/index.mts',
          '/project/src/index.ts',
        ],
        outputFile: '/project/lib/index.d.ts',
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
        platform: 'neutral',
        entryPath: './lib/index.node.d.ts',
        sourceFile: [
          '/project/src/index.node.ts',
          '/project/src/index.node.js',
        ],
        outputFile: '/project/lib/index.node.d.ts',
      },
      {
        key: 'exports["."].import.node.default',
        module: 'esmodule',
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: 'neutral',
        entryPath: './lib/index.node.d.ts',
        sourceFile: [
          '/project/src/index.node.ts',
          '/project/src/index.node.js',
        ],
        outputFile: '/project/lib/index.node.d.ts',
      },
    ]);
  });

  test('types entry does not accept nesting', () => {
    expect(() =>
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
      }),
    ).toThrowErrorMatchingSnapshot();
  });
});
