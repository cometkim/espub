import { describe, test, expect, vi } from 'vitest';
import { type TSConfig } from 'pkg-types';

import { type Context } from './context';
import { type Flags } from './cli';
import { type Manifest } from './manifest';
import { type Reporter } from './reporter';
import { parseConfig } from './context';
import { loadTargets } from './target';

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

describe('parseConfig', () => {
  const reporter = new ViReporter();
  const defaultFlags: Flags = {
    cwd: '/project',
    clean: false,
    verbose: false,
    platform: undefined,
    rootDir: undefined,
    outDir: undefined,
    tsconfig: 'tsconfig.json',
    importMaps: 'package.json',
    jsx: undefined,
    jsxFactory: undefined,
    jsxFragment: undefined,
    jsxImportSource: undefined,
    external: [],
    standalone: false,
    bundle: true,
    dts: true,
    sourcemap: true,
    legalComments: true,
  };
  const defaultManifest: Manifest = {
    name: 'package',
  };
  const defaultTsConfig: TSConfig = {
    compilerOptions: {
      target: 'ESNext', // ESNext,
      declaration: true,
    },
  };
  const defaultTargets = loadTargets({
    manifest: defaultManifest,
  });

  test('validate manifest', () => {
    const result = parseConfig({
      flags: defaultFlags,
      manifest: defaultManifest,
      targets: defaultTargets,
      reporter,
    });

    expect(result).toEqual<Context>({
      cwd: '/project',
      verbose: false,
      module: 'commonjs',
      platform: 'neutral',
      sourcemap: true,
      legalComments: true,
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
    });
  });

  describe('flags', () => {
    test('--rootDir', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          rootDir: '.',
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: false,
        standalone: false,
        rootDir: '.',
        outDir: 'lib',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        tsconfigPath: undefined,
        importMapsPath: '/project/package.json',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('--outDir', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          outDir: '.',
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: '.',
        tsconfigPath: undefined,
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        importMapsPath: '/project/package.json',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('rootDir=outDir is not allowed without TypeScript', () => {
      expect(() => parseConfig({
        flags: {
          ...defaultFlags,
          rootDir: '.',
          outDir: '.',
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
      })).toThrowErrorMatchingSnapshot();
    });
  });

  describe('node platform', () => {
    test('platform should be node when engines.node exist', () => {
      const manifest = {
        ...defaultManifest,
        engines: {
          node: '>=16.0.0',
        },
      };

      const targets = loadTargets({
        manifest,
      });

      const result = parseConfig({
        flags: defaultFlags,
        targets,
        manifest,
        reporter,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'node',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: undefined,
        importMapsPath: '/project/package.json',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest,
        targets: [
          'chrome96',
          'firefox115',
          'edge124',
          'ios15.6',
          'safari17.4',
          'node16.0.0',
          'deno1.9',
        ],
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });
  });

  describe('externalDependencies', () => {
    test('externalDependencies has manifest dependencies', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: {
          ...defaultManifest,
          dependencies: {
            'dependency-a': '^1.0.0',
            'dependency-b': '^1.0.0',
            'dependency-c': '^1.0.0',
          },
          peerDependencies: {
            'peer-dependency-a': '^1.0.0',
            'peer-dependency-b': '^1.0.0',
          },
        },
        targets: defaultTargets,
        reporter,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: undefined,
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        importMapsPath: '/project/package.json',
        externalDependencies: [
          'dependency-a',
          'dependency-b',
          'dependency-c',
          'peer-dependency-a',
          'peer-dependency-b',
        ],
        forceExternalDependencies: [],
        manifest: {
          ...defaultManifest,
          dependencies: {
            'dependency-a': '^1.0.0',
            'dependency-b': '^1.0.0',
            'dependency-c': '^1.0.0',
          },
          peerDependencies: {
            'peer-dependency-a': '^1.0.0',
            'peer-dependency-b': '^1.0.0',
          },
        },
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('forceExternalDependencies always include --external flag list', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          external: [
            'external-a',
            'external-b',
            'external-c',
          ],
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: undefined,
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        importMapsPath: '/project/package.json',
        externalDependencies: [
          'external-a',
          'external-b',
          'external-c',
        ],
        forceExternalDependencies: [
          'external-a',
          'external-b',
          'external-c',
        ],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });
  });

  describe('tsCompilerOptions', () => {
    test('declaration=true', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfigPath: 'tsconfig.json',
        tsconfig: defaultTsConfig,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: true,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: '/project/package.json',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('declaration=false', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          compilerOptions: {
            ...defaultTsConfig.compilerOptions,
            declaration: false,
            standalone: false,
          },
        },
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: '/project/package.json',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('declaration=true, --no-dts', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          dts: false,
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfigPath: 'tsconfig.json',
        tsconfig: defaultTsConfig,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: '/project/package.json',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('respect rootDir and outDir in compilerOptions', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          ...defaultTsConfig,
          compilerOptions: {
            ...defaultTsConfig.compilerOptions,
            rootDir: 'tsconfig-src',
            outDir: 'tsconfig-lib',
          },
        },
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: true,
        standalone: false,
        rootDir: 'tsconfig-src',
        outDir: 'tsconfig-lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: '/project/package.json',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('respect jsx in compilerOptions', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          ...defaultTsConfig,
          compilerOptions: {
            ...defaultTsConfig.compilerOptions,
            jsx: 'react-jsxdev',
          },
        },
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: true,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: '/project/package.json',
        jsx: 'automatic',
        jsxDev: true,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('respect jsxSource in compilerOptions', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          ...defaultTsConfig,
          compilerOptions: {
            ...defaultTsConfig.compilerOptions,
            jsx: 'react',
            jsxFactory: 'h',
            jsxFragmentFactory: 'Fragment',
            jsxImportSource: 'preact',
          },
        },
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        legalComments: true,
        bundle: true,
        declaration: true,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: '/project/package.json',
        jsx: 'transform',
        jsxDev: false,
        jsxFactory: 'h',
        jsxFragment: 'Fragment',
        jsxImportSource: 'preact',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('respect sourceMap in compilerOptions', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          ...defaultTsConfig,
          compilerOptions: {
            ...defaultTsConfig.compilerOptions,
            sourceMap: false,
          },
        },
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: false,
        legalComments: true,
        bundle: true,
        declaration: true,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: '/project/package.json',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('flags precedense over tsconfig', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          sourcemap: false,
          jsx: 'preserve',
          rootDir: 'flags-src',
          outDir: 'flags-lib',
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          ...defaultTsConfig,
          compilerOptions: {
            ...defaultTsConfig.compilerOptions,
            sourceMap: true,
            jsx: 'react-jsxdev',
            rootDir: 'tsconfig-src',
            outDir: 'tsconfig-lib',
          },
        },
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: false,
        legalComments: true,
        bundle: true,
        declaration: true,
        standalone: false,
        rootDir: 'flags-src',
        outDir: 'flags-lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: '/project/package.json',
        jsx: 'preserve',
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolvePath: expect.any(Function),
        resolveRelativePath: expect.any(Function),
      });
    });

    test('rootDir=outDir is allowed with TypeScript', () => {
      expect(() => parseConfig({
        flags: {
          ...defaultFlags,
          rootDir: '.',
          outDir: '.',
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        tsconfig: defaultTsConfig,
      })).not.toThrowError();
    });
  });
});
