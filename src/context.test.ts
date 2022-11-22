import { describe, test, expect, vi } from 'vitest';
import type { TSConfig } from 'pkg-types';

import type { PathResolver } from './common';
import { parseConfig } from './context';
import type { Context } from './context';
import type { Flags } from './cli';
import type { Manifest } from './manifest';
import type { Reporter } from './report';

describe('parseConfig', () => {
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

  const reporter: Reporter = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  const resolve: PathResolver = vi.fn();

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

    test('rootDir=outDir', () => {
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
          ...defaultTargets,
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
          ...defaultTargets,
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
  });
});
