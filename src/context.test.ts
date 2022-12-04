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
}

describe('parseConfig', () => {
  const reporter = new ViReporter();
  const resolve: PathResolver = vi.fn();
  const defaultFlags: Flags = {
    cwd: '/project',
    platform: undefined,
    rootDir: undefined,
    outDir: undefined,
    tsconfig: 'tsconfig.json',
    importMaps: 'package.json',
    external: [],
    standalone: false,
    noDts: false,
    noSourcemap: false,
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
      module: 'commonjs',
      platform: 'neutral',
      sourcemap: true,
      declaration: false,
      standalone: false,
      rootDir: 'src',
      outDir: 'lib',
      tsconfigPath: 'tsconfig.json',
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
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: '.',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
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
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: '.',
        tsconfigPath: 'tsconfig.json',
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
        module: 'commonjs',
        platform: 'node',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        module: 'commonjs',
        platform: 'node',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        tsconfig: defaultTsConfig,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: true,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
          noDts: true,
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
        tsconfig: defaultTsConfig,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        standalone: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: true,
        standalone: false,
        rootDir: 'tsconfig-src',
        outDir: 'tsconfig-lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
          rootDir: 'flags-src',
          outDir: 'flags-lib',
        },
        manifest: defaultManifest,
        targets: defaultTargets,
        reporter,
        resolve,
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
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: true,
        standalone: false,
        rootDir: 'flags-src',
        outDir: 'flags-lib',
        tsconfigPath: 'tsconfig.json',
        importMapsPath: 'package.json',
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
