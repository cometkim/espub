import * as path from "node:path";
import { describe, test, expect, vi } from "vitest";

import type { Flags } from './cli';
import { parseConfig } from './context';
import type { Manifest } from "./manifest";
import type { Reporter } from "./report";
import type { Entry } from "./entry";
import { getEntriesFromContext } from "./entry";

describe("getEntriesFromContext", () => {
  const resolvePath = (cwd: string, to: string) => path.join(cwd, to);

  const reporter: Reporter = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

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

  const getEntriesFromManifest = (manifest: Manifest) => {
    const context = parseConfig({
      flags: defaultFlags,
      manifest,
    });

    return getEntriesFromContext({
      context,
      resolvePath,
      reporter,
    });
  };

  test("empty package", () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
      }),
    ).toEqual([]);
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
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
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
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
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
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
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
        platform: "netural",
        entryPath: "./lib/index.cjs",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.cjs",
      },
    ]);

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
        platform: "netural",
        entryPath: "./lib/index.mjs",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.mjs",
      },
    ]);
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
        platform: "netural",
        entryPath: "./lib/index.json",
        sourceFile: ["/project/src/index.json"],
        outputFile: "/project/lib/index.json",
      },
    ]);

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
        platform: "netural",
        sourceFile: [
          "/project/src/index.css.cjs",
          "/project/src/index.css.js",
          "/project/src/index.css",
        ],
        outputFile: "/project/lib/index.css",
      },
    ]);
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
        platform: "netural",
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
        platform: "netural",
        entryPath: "./lib/module.js",
        sourceFile: ["/project/src/module.mjs", "/project/src/module.js"],
        outputFile: "/project/lib/module.js",
      },
    ]);
  });

  test('prefer "main" over "module" on conflict', () => {
    expect(
      getEntriesFromManifest({
        name: "my-package",
        main: "./lib/index.js",
        module: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
      {
        key: "main",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);

    expect(
      getEntriesFromManifest({
        name: "my-package",
        module: "./lib/index.js",
        main: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
      {
        key: "main",
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
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
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);

    expect(
      getEntriesFromManifest({
        name: "my-package",
        module: "./lib/index.js",
        exports: "./lib/index.js",
      }),
    ).toEqual<Entry[]>([
      {
        key: "exports",
        module: "commonjs",
        mode: "production",
        minify: false,
        sourcemap: true,
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
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
        platform: "netural",
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
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);

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
        platform: "netural",
        entryPath: "./lib/index.js",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.js",
      },
    ]);
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
        platform: "netural",
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
        platform: "netural",
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
        platform: "netural",
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
        platform: "netural",
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
        platform: "netural",
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
        platform: "netural",
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
        platform: "netural",
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

  describe.todo("in TypeScript project");

  describe.todo("when rootDir=./src, outDir=.");
  describe.todo("when rootDir=., outDir=./lib");
  describe.todo("when rootDir=outDir=.");
  describe.todo("when rootDir=outDir=./lib");
  describe.todo("when rootDir=outDir=./lib & TypeScript sources");
});
