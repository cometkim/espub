import { describe, test, expect } from 'vitest';


import {
  normalizeImportMaps,
  type NodeImportMaps,
  type ValidNodeImportMaps,
} from './importMaps';

function validate(importMaps: NodeImportMaps): ValidNodeImportMaps {
  return importMaps as unknown as ValidNodeImportMaps;
}

describe('normalizeImportMaps', () => {
  test('flat importMaps (as is)', () => {
    const nodeImportMaps = validate({
      imports: {
        './features.js': './src/features.js',
      },
    });
    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'esmodule',
        platform: 'neutral',
        minify: false,
        sourcemap: false,
      }),
    ).toEqual({
      imports: {
        './features.js': './src/features.js',
      },
    });
  });

  test('conditional importMaps', () => {
    const nodeImportMaps = validate({
      imports: {
        '#dep': {
          'node': 'dep-node-native',
          'default': './dep-polyfill.js',
        },
      },
    });
    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'esmodule',
        platform: 'node',
        minify: false,
        sourcemap: false,
      }),
    ).toEqual({
      imports: {
        '#dep': 'dep-node-native',
      },
    });
    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'esmodule',
        platform: 'browser',
        minify: false,
        sourcemap: false,
      }),
    ).toEqual({
      imports: {
        '#dep': './dep-polyfill.js',
      },
    });
    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'esmodule',
        platform: 'neutral',
        minify: false,
        sourcemap: false,
      }),
    ).toEqual({
      imports: {
        '#dep': './dep-polyfill.js',
      },
    });
  });

  test('nested conditional importMaps', () => {
    const nodeImportMaps = validate({
      imports: {
        '#dep': {
          'node': {
            'require': './dep.cjs',
            'import': './dep.mjs',
          },
          'default': './dep.js',
        },
      },
    });
    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'commonjs',
        platform: 'node',
        minify: false,
        sourcemap: false,
      }),
    ).toEqual({
      imports: {
        '#dep': './dep.cjs',
      },
    });
    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'esmodule',
        platform: 'node',
        minify: false,
        sourcemap: false,
      }),
    ).toEqual({
      imports: {
        '#dep': './dep.mjs',
      },
    });
    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'commonjs',
        platform: 'neutral',
        minify: false,
        sourcemap: false,
      }),
    ).toEqual({
      imports: {
        '#dep': './dep.js',
      },
    });
    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'esmodule',
        platform: 'browser',
        minify: false,
        sourcemap: false,
      }),
    ).toEqual({
      imports: {
        '#dep': './dep.js',
      },
    });
  });

  describe('common usecases', () => {
    test('ReScript dual package', () => {
      const nodeImportMaps = validate({
        imports: {
          '@rescript/std/lib/es6/': {
            'require': '@rescript/std/lib/js/',
            'default': '@rescript/std/lib/es6/',
          },
        },
      });
      expect(
        normalizeImportMaps(nodeImportMaps, {
          mode: undefined,
          module: 'commonjs',
          platform: 'neutral',
          minify: false,
          sourcemap: false,
        }),
      ).toEqual({
        imports: {
          '@rescript/std/lib/es6/': '@rescript/std/lib/js/',
        },
      });
      expect(
        normalizeImportMaps(nodeImportMaps, {
          mode: undefined,
          module: 'esmodule',
          platform: 'neutral',
          minify: false,
          sourcemap: false,
        }),
      ).toEqual({
        imports: {
          '@rescript/std/lib/es6/': '@rescript/std/lib/es6/',
        },
      });
    });
  });
})
