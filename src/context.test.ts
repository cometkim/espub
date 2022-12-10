import { describe, test, expect, vi } from 'vitest';
import { type TSConfig } from 'pkg-types';

import { type PathResolver } from './common';
import { type Context } from './context';
import { type Flags } from './cli';
import { type Manifest } from './manifest';
import { type Reporter } from './reporter';
import { parseConfig } from './context';

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
  const resolve: PathResolver = vi.fn();
  const defaultFlags: Flags = {
    cwd: '/project',
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
    dts: true,
    sourcemap: true,
  };
  const defaultManifest: Manifest = {
    name: 'package'
  };
  const defaultTsConfig: TSConfig = {
    compilerOptions: {
      target: 'ESNext', // ESNext,
      declaration: true,
    },
  };
  const defaultTargets: string[] = [
    'chrome',
    'firefox',
    'safari',
  ];

  test('validate manifest', () => {
    const result = parseConfig({
      flags: defaultFlags,
      manifest: defaultManifest,
      targets: defaultTargets,
      reporter,
      resolve,
    });

    expect(result).toEqual<Context>({
      cwd: '/project',
      verbose: false,
      module: 'commonjs',
      platform: 'neutral',
      sourcemap: true,
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
      importMapsPath: 'package.json',
      externalDependencies: [],
      forceExternalDependencies: [],
      manifest: defaultManifest,
      targets: defaultTargets,
      reporter,
      resolve,
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
        resolve,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
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
        importMapsPath: 'package.json',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
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
        resolve,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
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
        importMapsPath: 'package.json',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
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
        resolve,
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

      const result = parseConfig({
        flags: defaultFlags,
        targets: defaultTargets,
        manifest,
        reporter,
        resolve,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'node',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: undefined,
        importMapsPath: 'package.json',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest,
        targets: [
          'node16',
        ],
        reporter,
        resolve,
      });
    });

    test('default node version is 14', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          platform: 'node',
        },
        targets: defaultTargets,
        manifest: defaultManifest,
        reporter,
        resolve,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'node',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: undefined,
        importMapsPath: 'package.json',
        jsx: undefined,
        jsxDev: false,
        jsxFactory: 'React.createElement',
        jsxFragment: 'Fragment',
        jsxImportSource: 'react',
        externalDependencies: [],
        forceExternalDependencies: [],
        manifest: defaultManifest,
        targets: [
          'node14',
        ],
        reporter,
        resolve,
      });
    });
  });

  describe('externalDependencies', () => {
    test.todo('externalDependencies has manifest dependencies')
    test.todo('forceExternalDependencies always include --external flag list')
    test.todo('externalDependencies always include --external flag list')
  });

  describe('tsCompilerOptions', () => {
    test('declaration=true', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
        tsconfigPath: 'tsconfig.json',
        tsconfig: defaultTsConfig,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: true,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        resolve,
      });
    });

    test('declaration=false', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
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
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        resolve,
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
        resolve,
        tsconfigPath: 'tsconfig.json',
        tsconfig: defaultTsConfig,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        verbose: false,
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        resolve,
      });
    });

    test('respect rootDir and outDir in compilerOptions', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
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
        declaration: true,
        standalone: false,
        rootDir: 'tsconfig-src',
        outDir: 'tsconfig-lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        resolve,
      });
    });

    test('respect jsx in compilerOptions', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
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
        declaration: true,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        resolve,
      });
    });

    test('respect jsxSource in compilerOptions', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
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
        declaration: true,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        resolve,
      });
    });

    test('flags precedense over tsconfig', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          jsx: 'preserve',
          rootDir: 'flags-src',
          outDir: 'flags-lib',
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
        tsconfigPath: 'tsconfig.json',
        tsconfig: {
          ...defaultTsConfig,
          compilerOptions: {
            ...defaultTsConfig.compilerOptions,
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
        sourcemap: true,
        declaration: true,
        standalone: false,
        rootDir: 'flags-src',
        outDir: 'flags-lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        resolve,
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
        resolve,
        tsconfig: defaultTsConfig,
      })).not.toThrowError();
    });
  });
});
