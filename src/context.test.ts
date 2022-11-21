import { describe, test, expect } from 'vitest';
import type { TSConfig } from 'pkg-types';

import { parseConfig } from './context';
import type { Context } from './context';
import type { Flags } from './cli';
import type { Manifest } from './manifest';

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

  test('validate manifest', () => {
    const result = parseConfig({
      flags: defaultFlags,
      manifest: defaultManifest,
    });

    expect(result).toEqual<Context>({
      cwd: '/project',
      module: 'commonjs',
      platform: 'neutral',
      sourcemap: true,
      declaration: false,
      rootDir: 'src',
      outDir: 'lib',
      tsconfigPath: 'tsconfig.json',
      manifest: defaultManifest,
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
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        rootDir: '.',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        manifest: defaultManifest,
      });
    });

    test('--outDir', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          outDir: '.',
        },
        manifest: defaultManifest,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        rootDir: 'src',
        outDir: '.',
        tsconfigPath: 'tsconfig.json',
        manifest: defaultManifest,
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
      })).toThrowErrorMatchingSnapshot();
    });
  });

  describe('tsCompilerOptions', () => {
    test('declaration=true', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        tsconfig: defaultTsConfig,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: true,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        manifest: defaultManifest,
      });
    });

    test('declaration=false', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        tsconfig: {
          compilerOptions: {
            ...defaultTsConfig.compilerOptions,
            declaration: false,
          },
        },
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        manifest: defaultManifest,
      });
    });

    test('declaration=true, --no-dts', () => {
      const result = parseConfig({
        flags: {
          ...defaultFlags,
          noDts: true,
        },
        manifest: defaultManifest,
        tsconfig: defaultTsConfig,
      });

      expect(result).toEqual<Context>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'neutral',
        sourcemap: true,
        declaration: false,
        rootDir: 'src',
        outDir: 'lib',
        tsconfigPath: 'tsconfig.json',
        manifest: defaultManifest,
      });
    });
  });
});
