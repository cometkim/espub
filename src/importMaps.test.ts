import { describe, test, expect, vi } from 'vitest';


import { type Context } from './context';
import { NanobundleConfigError } from './errors';
import { type Manifest } from './manifest';
import { type Reporter } from './reporter';
import {
  replaceSubpathPattern,
  validateImportMaps,
  normalizeImportMaps,
  type NodeImportMaps,
  type ValidNodeImportMaps,
} from './importMaps';

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

describe('validateImportMaps', () => {
  const reporter = new ViReporter();
  const defaultManifest: Manifest = {
    name: 'package'
  };
  const defaultTargets: string[] = [
    'chrome',
    'firefox',
    'safari',
  ];
  const defaultContext: Context = {
    cwd: '/project',
    verbose: false,
    module: 'commonjs',
    platform: 'neutral',
    sourcemap: true,
    bundle: true,
    declaration: false,
    standalone: false,
    jsx: undefined,
    jsxDev: false,
    jsxFactory: 'React.createElement',
    jsxFragment: 'Fragment',
    jsxImportSource: 'react',
    rootDir: 'src',
    outDir: 'lib',
    tsconfigPath: undefined,
    importMapsPath: '/project/package.json',
    externalDependencies: [],
    forceExternalDependencies: [],
    manifest: defaultManifest,
    targets: defaultTargets,
    reporter,
    resolvePath: expect.any(Function),
    resolveRelativePath: expect.any(Function),
  };

  test('subpath import pattern only allowed for Node.js-style imports', async () => {
    await expect(validateImportMaps({
      context: defaultContext,
      importMaps: {
        imports: {
          'src/*.js': 'dest/*.js',
        },
      },
    })).rejects.toThrowError(NanobundleConfigError);

    await expect(validateImportMaps({
      context: defaultContext,
      importMaps: {
        imports: {
          '#src/*.js': '#dest/*.js',
        },
      },
    })).resolves.not.toThrow();
  });
});

describe('normalizeImportMaps', () => {
  function validate(importMaps: NodeImportMaps): ValidNodeImportMaps {
    return importMaps as unknown as ValidNodeImportMaps;
  }

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
        customConditions: [],
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
        customConditions: [],
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
        customConditions: [],
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
        customConditions: [],
      }),
    ).toEqual({
      imports: {
        '#dep': './dep-polyfill.js',
      },
    });
  });

  test('custom condition importMaps', () => {
    const nodeImportMaps = validate({
      imports: {
        '#shared/*.js': './src/shared/*.js',
        '#globals/*.js': {
          custom: './src/globals/*.custom.js',
          default: './src/globals/*.js',
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
        customConditions: ['custom'],
      }),
    ).toEqual({
      imports: {
        '#shared/*.js': './src/shared/*.js',
        '#globals/*.js': './src/globals/*.custom.js',
      },
    });

    expect(
      normalizeImportMaps(nodeImportMaps, {
        mode: undefined,
        module: 'commonjs',
        platform: 'neutral',
        minify: false,
        sourcemap: false,
        customConditions: [],
      }),
    ).toEqual({
      imports: {
        '#shared/*.js': './src/shared/*.js',
        '#globals/*.js': './src/globals/*.js',
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
        customConditions: [],
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
        customConditions: [],
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
        customConditions: [],
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
        customConditions: [],
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
          customConditions: [],
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
          customConditions: [],
        }),
      ).toEqual({
        imports: {
          '@rescript/std/lib/es6/': '@rescript/std/lib/es6/',
        },
      });
    });
  });
});

describe('replaceSubpathPattern', () => {
  test('replace', () => {
    expect(
      replaceSubpathPattern(
        {
          imports: {
            '#test/': './src/test/',
          }
        },
        '#test/module.js',
      ),
    ).toEqual('./src/test/module.js');

    expect(
      replaceSubpathPattern(
        {
          imports: {
            '#test/*': './src/test/test.css',
          },
        },
        '#test/module.js',
      ),
    ).toEqual('./src/test/test.css');

    expect(
      replaceSubpathPattern(
        {
          imports: {
            '#test/*.js': './src/test/*.js',
          },
        },
        '#test/module.js',
      ),
    ).toEqual('./src/test/module.js');

    expect(
      replaceSubpathPattern(
        {
          imports: {
            '#test/*.js': './src/test/*.default.js',
          },
        },
        '#test/module.js',
      ),
    ).toEqual('./src/test/module.default.js');
  });

  test('does not replace', () => {
    expect(
      replaceSubpathPattern(
        {
          imports: {
            '#test1/': './src/test/',
          },
        },
        '#test2/module.js',
      ),
    ).toEqual('#test2/module.js');

    expect(
      replaceSubpathPattern(
        {
          imports: {
            '#test/*.js': './src/test/*.js',
          },
        },
        '#test/module.css',
      ),
    ).toEqual('#test/module.css');
  });

  test('priority', () => {
    expect(
      replaceSubpathPattern(
        {
          imports: {
            '#test/': './src/test1/',
            '#test/module.js': './src/test2/module.js',
          },
        },
        '#test/module.js',
      ),
    ).toEqual('./src/test2/module.js');
  });
});
