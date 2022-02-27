import * as path from 'node:path';
import { describe, expect } from 'vitest';

import type { Config } from './config';
import type { Reporter } from './report';
import type { Entry } from './entry';
import { getEntriesFromConfig } from './entry';

describe('getEntriesFromConfig', test => {
  const noop = () => {};

  const resolvePath = (to: string) => path.join('/project', to);

  const reporter: Reporter = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
  };

  const expectEntries = (config: Config) => {
    return expect(
      getEntriesFromConfig({
        config,
        resolvePath,
        reporter,
      }),
    );
  };

  test('empty package', () => {
    expectEntries({
      name: 'my-package',
    }).toEqual([]);
  });

  test('no source', () => {
    expectEntries({
      name: 'my-package',
      main: './index.js',
    }).toEqual([]);
  });

  test('main field, implicit commonjs', () => {
    expectEntries({
      name: 'my-package',
      source: './src/index.ts',
      main: './lib/index.js',
    }).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/index.js',
        outputFile: '/project/lib/index.js',
        platform: 'web',
      },
    ]);
  });

  test('main field, explicit commonjs', () => {
    expectEntries({
      name: 'my-package',
      type: 'commonjs',
      source: './src/index.ts',
      main: './lib/index.js',
    }).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/index.js',
        outputFile: '/project/lib/index.js',
        platform: 'web',
      },
    ]);
  });

  test('main field, explicit esmodule', () => {
    expectEntries({
      name: 'my-package',
      type: 'module',
      source: './src/index.ts',
      main: './lib/index.js',
    }).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'esmodule',
        path: './lib/index.js',
        outputFile: '/project/lib/index.js',
        platform: 'web',
      },
    ]);
  });


  test('main field, commonjs file extension', () => {
    expectEntries({
      name: 'my-package',
      type: 'module',
      source: './src/index.ts',
      main: './lib/index.cjs',
    }).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/index.cjs',
        outputFile: '/project/lib/index.cjs',
        platform: 'node',
      },
    ]);

    expectEntries({
      name: 'my-package',
      type: 'module',
      source: './src/index.ts',
      main: './lib/index.node',
    }).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/index.node',
        outputFile: '/project/lib/index.node',
        platform: 'node',
      },
    ]);
  });

  test('main field, esmodule file extension', () => {
    expectEntries({
      name: 'my-package',
      type: 'commonjs',
      source: './src/index.ts',
      main: './lib/index.mjs',
    }).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'esmodule',
        path: './lib/index.mjs',
        outputFile: '/project/lib/index.mjs',
        platform: 'web',
      },
    ]);
  });

  test('module field', () => {
    expectEntries({
      name: 'my-package',
      type: 'commonjs',
      source: './src/index.ts',
      main: './lib/main.js',
      module: './lib/module.js',
    }).toEqual<Entry[]>([
      {
        key: 'main',
        module: 'commonjs',
        path: './lib/main.js',
        outputFile: '/project/lib/main.js',
        platform: 'web',
      },
      {
        key: 'module',
        module: 'esmodule',
        path: './lib/module.js',
        outputFile: '/project/lib/module.js',
        platform: 'web',
      },
    ]);
  });

  test('exports', () => {
    expectEntries({
      name: 'my-package',
      type: 'commonjs',
      source: './src/index.ts',
      exports: './lib/index.js',
    }).toEqual<Entry[]>([
      {
        key: 'exports',
        module: 'commonjs',
        path: './lib/index.js',
        outputFile: '/project/lib/index.js',
        platform: 'web',
      },
    ]);

    expectEntries({
      name: 'my-package',
      source: './src/index.ts',
      exports: {
        import: './lib/index.esmodule.js',
        require: './lib/index.commonjs.js',
      },
    }).toEqual<Entry[]>([
      {
        key: 'exports["import"]',
        module: 'esmodule',
        path: './lib/index.esmodule.js',
        outputFile: '/project/lib/index.esmodule.js',
        platform: 'web',
      },
      {
        key: 'exports["require"]',
        module: 'commonjs',
        path: './lib/index.commonjs.js',
        outputFile: '/project/lib/index.commonjs.js',
        platform: 'node',
      },
    ]);

    expectEntries({
      name: 'my-package',
      source: './src/index.ts',
      exports: {
        '.': {
          import: './lib/index.esmodule.js',
          require: './lib/index.commonjs.js',
        },
        './package.json': './package.json',
      },
    }).toEqual<Entry[]>([
      {
        key: 'exports["."].import',
        module: 'esmodule',
        path: './lib/index.esmodule.js',
        outputFile: '/project/lib/index.esmodule.js',
        platform: 'web',
      },
      {
        key: 'exports["."].require',
        module: 'commonjs',
        path: './lib/index.commonjs.js',
        outputFile: '/project/lib/index.commonjs.js',
        platform: 'node',
      },
    ]);
  });
});
