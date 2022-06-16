import * as path from 'node:path';
import { describe, expect, vi } from 'vitest';

import type { Config } from './config';
import type { Reporter } from './report';
import type { Entry } from './entry';
import { getEntriesFromConfig } from './entry';

describe('getEntriesFromConfig', test => {
  const resolvePath = (to: string) => path.join('/project', to);

  const reporter: Reporter = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const entriesFromConfig = (config: Config) => {
    return getEntriesFromConfig({
      config,
      resolvePath,
      reporter,
      rootDir: './src',
      outDir: './lib',
    });
  };

  test('empty package', () => {
    expect(entriesFromConfig({
      name: 'my-package',
    })).toEqual([]);
  });

  test('main entry, implicit commonjs', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      main: './lib/index.js',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/index.js',
        mode: 'production',
        platform: 'browser',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/lib/index.js',
      },
    ]);
  });

  test('main field, explicit commonjs', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      type: 'commonjs',
      main: './lib/index.js',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/index.js',
        mode: 'production',
        platform: 'browser',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/lib/index.js',
      },
    ]);
  });

  test('main field, explicit esmodule', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      type: 'module',
      main: './lib/index.js',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'esmodule',
        path: './lib/index.js',
        mode: 'production',
        platform: 'browser',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/lib/index.js',
      },
    ]);
  });

  test('main field with module extension', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      type: 'module',
      main: './lib/index.cjs',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/index.cjs',
        mode: 'production',
        platform: 'browser',
        sourceFile: ['/project/src/index.cjs'],
        outputFile: '/project/lib/index.cjs',
      },
    ]);

    expect(entriesFromConfig({
      name: 'my-package',
      type: 'commonjs',
      main: './lib/index.mjs',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'esmodule',
        path: './lib/index.mjs',
        mode: 'production',
        platform: 'browser',
        sourceFile: ['/project/src/index.mjs'],
        outputFile: '/project/lib/index.mjs',
      },
    ]);
  });

  test('main field accepts js, json, node addon paths', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      main: './lib/index.json',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'file',
        path: './lib/index.json',
        mode: 'production',
        platform: 'browser',
        sourceFile: ['/project/src/index.json'],
        outputFile: '/project/lib/index.json',
      },
    ]);

    expect(entriesFromConfig({
      name: 'my-package',
      main: './lib/index.node',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'file',
        path: './lib/index.node',
        mode: 'production',
        platform: 'node',
        sourceFile: ['/project/src/index.node'],
        outputFile: '/project/lib/index.node',
      },
    ]);

    // otherwise treated as JavaScript text
    expect(entriesFromConfig({
      name: 'my-package',
      main: './lib/index.css',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/index.css',
        mode: 'production',
        platform: 'browser',
        sourceFile: ['/project/src/index.css'],
        outputFile: '/project/lib/index.css',
      },
    ]);
  });

  test('module field', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      main: './lib/main.js',
      module: './lib/module.js',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        mode: 'production',
        path: './lib/main.js',
        sourceFile: ['/project/src/main.js'],
        outputFile: '/project/lib/main.js',
        platform: 'browser',
      },
      {
        key: 'module',
        module: 'esmodule',
        mode: 'production',
        path: './lib/module.js',
        sourceFile: ['/project/src/module.js'],
        outputFile: '/project/lib/module.js',
        platform: 'browser',
      },
    ]);
  });

  test('prefer "main" over "module" on conflict', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      main: './lib/index.js',
      module: './lib/index.js',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        mode: 'production',
        path: './lib/index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/lib/index.js',
        platform: 'browser',
      },
    ]);

    expect(entriesFromConfig({
      name: 'my-package',
      module: './lib/index.js',
      main: './lib/index.js',
    })).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        mode: 'production',
        path: './lib/index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/lib/index.js',
        platform: 'browser',
      },
    ]);
  });

  test('prefer "exports" over "module" on conflict', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      exports: './lib/index.js',
      module: './lib/index.js',
    })).toEqual<Entry[]>([
      {
        key: 'exports',
        module: 'commonjs',
        mode: 'production',
        path: './lib/index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/lib/index.js',
        platform: 'browser',
      },
    ]);

    expect(entriesFromConfig({
      name: 'my-package',
      module: './lib/index.js',
      exports: './lib/index.js',
    })).toEqual<Entry[]>([
      {
        key: 'exports',
        module: 'commonjs',
        mode: 'production',
        path: './lib/index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/lib/index.js',
        platform: 'browser',
      },
    ]);
  });

  test('exports field', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      exports: './index.js',
    })).toEqual<Entry[]>([
      {
        key: 'exports',
        module: 'commonjs',
        mode: 'production',
        path: './index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/index.js',
        platform: 'browser',
      },
    ]);
  });

  test('exports field always precedense over main', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      main: './index.js',
      exports: './index.js',
    })).toEqual<Entry[]>([
      {
        key: 'exports',
        module: 'commonjs',
        mode: 'production',
        path: './index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/index.js',
        platform: 'browser',
      },
    ]);
  });

  test('conditional exports', () => {
    expect(entriesFromConfig({
      name: 'my-package',
      exports: {
        require: './index.js',
        import: './index.js',
      },
    })).toEqual<Entry[]>([
      {
        key: 'exports.require',
        module: 'commonjs',
        mode: 'production',
        path: './index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/index.js',
        platform: 'browser',
      },
      {
        key: 'exports.import',
        module: 'esmodule',
        mode: 'production',
        path: './index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/index.js',
        platform: 'browser',
      },
    ]);

    expect(entriesFromConfig({
      name: 'my-package',
      exports: {
        '.': './lib/index.js',
        './index': './lib/index.js',
        './index.js': './lib/index.js',
        './feature': './lib/feature/index.js',
        './feature/index.js': './lib/feature/index.js',
        './package.json': './package.json',
      },
    })).toEqual<Entry[]>([
      {
        key: 'exports["."]',
        module: 'commonjs',
        mode: 'production',
        path: './lib/index.js',
        sourceFile: ['/project/src/index.js'],
        outputFile: '/project/lib/index.js',
        platform: 'browser',
      },
      {
        key: 'exports["./feature"]',
        module: 'commonjs',
        mode: 'production',
        path: './feature/index.js',
        sourceFile: ['/project/src/feature/index.js'],
        outputFile: '/project/lib/feature/index.js',
        platform: 'browser',
      },
    ]);
  });

  test('nested conditional exports', () => {
  });

  test('conditional exports community definitions', () => {
  });

  describe.todo('in TypeScript project');

  describe.todo('when rootDir=./src, outDir=.');
  describe.todo('when rootDir=., outDir=./lib');
  describe.todo('when rootDir=outDir=.');
  describe.todo('when rootDir=outDir=./lib');
  describe.todo('when rootDir=outDir=./lib & TypeScript sources');
});
