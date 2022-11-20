import { resolve } from 'node:path';
import { describe, test, expect } from 'vitest';
import type { CompilerOptions as TSCompilerOptions } from 'typescript';

import { parseConfig } from './config';
import type { ParsedConfig } from './config';
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

  const defaultTsCompilerOptions: TSCompilerOptions = {
    target: 99, // ESNext,
    declaration: true,
  };

  test('validate manifest', () => {
    const result = parseConfig({
      flags: defaultFlags,
      manifest: defaultManifest,
    });

    expect(result).toEqual<ParsedConfig>({
      cwd: '/project',
      module: 'commonjs',
      platform: 'netural',
      sourcemap: true,
      declaration: false,
      rootDir: 'src',
      outDir: 'lib',
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

      expect(result).toEqual<ParsedConfig>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'netural',
        sourcemap: true,
        declaration: false,
        rootDir: '.',
        outDir: 'lib',
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

      expect(result).toEqual<ParsedConfig>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'netural',
        sourcemap: true,
        declaration: false,
        rootDir: 'src',
        outDir: '.',
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
        tsCompilerOptions: defaultTsCompilerOptions,
      });

      expect(result).toEqual<ParsedConfig>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'netural',
        sourcemap: true,
        declaration: true,
        rootDir: 'src',
        outDir: 'lib',
        manifest: defaultManifest,
      });
    });

    test('declaration=false', () => {
      const result = parseConfig({
        flags: defaultFlags,
        manifest: defaultManifest,
        tsCompilerOptions: {
          ...defaultTsCompilerOptions,
          declaration: false,
        },
      });

      expect(result).toEqual<ParsedConfig>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'netural',
        sourcemap: true,
        declaration: false,
        rootDir: 'src',
        outDir: 'lib',
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
        tsCompilerOptions: defaultTsCompilerOptions,
      });

      expect(result).toEqual<ParsedConfig>({
        cwd: '/project',
        module: 'commonjs',
        platform: 'netural',
        sourcemap: true,
        declaration: false,
        rootDir: 'src',
        outDir: 'lib',
        manifest: defaultManifest,
      });
    });
  });
});
