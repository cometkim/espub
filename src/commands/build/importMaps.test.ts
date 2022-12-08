import { describe, test, expect } from 'vitest';


import {
  normalizeImportMaps,
  type ValidNodeImportMaps,
} from './importMaps';

describe('normalizeImportMaps', () => {
  test('flat importMaps', () => {
    const nodeImportMaps = {
      imports: {
        './features.js': './src/features.js',
      },
    };
  });

  test('conditional importMaps', () => {
    const nodeImportMaps = {
      imports: {
        '#dep': {
          'node': 'dep-node-native',
          'default': './dep-polyfill.js',
        },
      },
    };
  });

  test('nested conditional importMaps', () => {
    const nodeImportMaps = {
      imports: {
        '#dep': {
          'node': {
            'require': './dep.cjs',
            'import': './dep.mjs',
          },
          'default': './dep.js',
        },
      },
    };
  });

  describe('common usecases', () => {
    test('ReScript dual package', () => {
      const nodeImportMaps = {
        imports: {
          '@rescript/std/lib/es6/': {
            'require': '@rescript/std/lib/js/',
            'default': '@rescript/std/lib/es6/',
          },
        },
      };

    });
  });
})
