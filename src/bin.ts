#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseTsConfig } from 'tsconfck';
import type {
  Program as TSProgram,
  CompilerOptions as TSCompilerOptions,
} from 'typescript';

import type { Reporter } from './report';
import { cli } from './cli';
import { loadTargets } from './target';
import { loadImportMaps, normalizeImportMaps, validateImportMaps } from './importMaps';
import { getEntriesFromContext } from './entry';
import { buildCommand } from './commands/build';
import { makePlugin as makeEmbedPlugin } from './plugins/esbuildEmbedPlugin';
import { makePlugin as makeImportMapsPlugin } from './plugins/esbuildImportMapsPlugin';
import { loadManifest } from './manifest';
import { parseConfig } from './config';

const { flags, input } = cli;
const [command] = input;
const noop = () => { };
const debugEnabled = process.env.DEBUG === 'true';

const reporter: Reporter = {
  debug: debugEnabled ? console.debug : noop,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

const resolvePath = (cwd: string, subpath: string) => path.resolve(cwd, subpath);

try {
  switch (command) {
    case undefined: {
      cli.showHelp(0);
    }

    case 'build': {
      const startedAt = performance.now();

      const manifest = await loadManifest({
        cwd: flags.cwd,
        resolvePath,
      });
      reporter.debug(`build ${manifest.name || 'unnamed'} package`);

      const tsconfigResult = await parseTsConfig(flags.tsconfig, { resolveWithEmptyIfConfigNotFound: true });
      const tsconfigPath = (
        tsconfigResult.tsconfigFile !== 'no_tsconfig_file_found'
          ? tsconfigResult.tsconfigFile
          : undefined
      );
      const tsconfig = (
        tsconfigResult.tsconfigFile !== 'no_tsconfig_file_found'
          ? tsconfigResult.tsconfig
          : undefined
      );
      if (tsconfigPath) {
        reporter.debug(`load tsconfig from ${tsconfigPath}`);
      }

      const config = parseConfig({
        flags,
        manifest,
        tsconfig,
        tsconfigPath,
      });

      const externalDependencies = [
        ...(config.dependencies ? Object.keys(config.dependencies) : []),
        ...(config.peerDependencies ? Object.keys(config.peerDependencies) : []),
        ...forceExternalDependencies,
      ];
      const importMaps = await loadImportMaps(
        flags.importMaps,
        { resolvePath },
      );
      const defaultImportMaps = validateImportMaps(
        normalizeImportMaps(importMaps, 'natural'),
        { resolvePath },
      );
      const nodeImportMaps = validateImportMaps(
        normalizeImportMaps(importMaps, 'node'),
        { resolvePath },
      );
      const embedPlugin = makeEmbedPlugin({
        reporter,
        standalone,
        externalDependencies,
        forceExternalDependencies,
      });
      const defaultImportMapsPlugin = makeImportMapsPlugin({
        name: 'default',
        imports: defaultImportMaps.imports,
        resolvePath,
      });
      const nodeImportMapsPlugin = makeImportMapsPlugin({
        name: 'node',
        imports: nodeImportMaps.imports,
        resolvePath,
      });
      const defaultPlugins = [
        defaultImportMapsPlugin,
        embedPlugin,
      ];
      const nodePlugins = [
        nodeImportMapsPlugin,
        embedPlugin,
      ];

      let tsProgram: TSProgram | undefined;
      if (flags.dts && config.types) {
        const ts = await import('typescript').then(mod => mod.default);
        const tsconfigResult = await parseNative(flags.tsconfig);

        tsconfig = tsconfigResult.tsconfigFile;
        reporter.debug(`load tsconfig from ${tsconfig}`);

        const compilerOptions: TSCompilerOptions = {
          ...tsconfigResult.result.options,

          allowJs: true,
          incremental: false,
          skipLibCheck: true,
          declaration: true,
          emitDeclarationOnly: true,
        };

        if (compilerOptions.noEmit) {
          reporter.warn('Ignored `compilerOptions.noEmit` since the package required `types` entry.');
          reporter.warn('You can still disable emitting declaration via `--no-dts` option');
          compilerOptions.noEmit = false;
        }

        const host = ts.createCompilerHost(compilerOptions);
        tsProgram = ts.createProgram([sourceFile], compilerOptions, host);
      }

      const targets = await loadTargets({ basePath });
      reporter.debug(`targets to ${targets.join(', ')}`);

      const entries = getEntriesFromContext({
        config,
        reporter,
        resolvePath,
      });

      await buildCommand({
        reporter,
        sourceFile,
        entries,
        targets,
        tsconfig,
        resolvePath,
        minify,
        sourcemap,
        webPlugins,
        nodePlugins,
      });

      if (tsProgram) {
        reporter.info('Emitting .d.ts files...');

        const { emittedFiles } = tsProgram.emit();
        reporter.debug('emitted', emittedFiles);
      }

      const endedAt = performance.now();
      const elapsedTime = (endedAt - startedAt).toFixed(1);
      reporter.info(`\n⚡ Done in ${elapsedTime}ms.`);

      break;
    }

    case 'watch': {
      throw new Error('sorry, not implemeted yet');
    }

    default: {
      throw new Error(`
Command "${command}" is not available.

Run \`nanobundle --help\` for more detail.`,
      );
    }
  }
} catch (error) {
  reporter.error(error);
  process.exit(1);
}
