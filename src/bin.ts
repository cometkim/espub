#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import type { Reporter } from './report';
import { cli } from './cli';
import { loadConfig } from './config';
import { loadTargets } from './target';
import { loadImportMaps, normalizeImportMaps, validateImportMaps } from './importMaps';
import { getEntriesFromConfig } from './entry';
import { buildCommand } from './commands/build';

const { flags, input } = cli;
const [command] = input;
const noop = () => {};
const debugEnabled = process.env.DEBUG === 'true';
const basePath = flags.cwd;
const reporter: Reporter = {
  debug: debugEnabled ? console.debug : noop,
  info: console.info,
  warn: console.warn,
  error: console.error,
};
const resolvePath = (file: string) => path.resolve(basePath, file);

try {
  switch (command) {
    case undefined: {
      cli.showHelp(0);
    }

    case 'build': {
      const startedAt = performance.now();

      const config = await loadConfig({ resolvePath });
      const sourceFile = config.source && resolvePath(config.source);
      if (!sourceFile || !fs.existsSync(sourceFile)) {
        throw new Error('`"source"` field must be specified in the package.json');
      }

      reporter.debug(`build ${config.name || 'unnamed'} package`);
      reporter.debug(`load source from ${sourceFile}`);

      const importMaps = await loadImportMaps(
        flags.importMaps,
        { resolvePath },
      );
      const webImportMaps = validateImportMaps(
        normalizeImportMaps(importMaps, 'web'),
        { resolvePath },
      );
      const nodeImportMaps = validateImportMaps(
        normalizeImportMaps(importMaps, 'node'),
        { resolvePath },
      );

      const tsconfig = ts.findConfigFile(
        basePath,
        ts.sys.fileExists,
        flags.tsconfig,
      );
      if (tsconfig) {
        reporter.debug(`load tsconfig from ${tsconfig}`);
      }

      const targets = await loadTargets({ basePath });
      reporter.debug(`targets to ${targets.join(', ')}`);

      const entries = getEntriesFromConfig(config, {
        sourceFile,
        reporter,
        resolvePath,
      });

      const externalDependencies = [
        ...(config.dependencies ? Object.keys(config.dependencies) : []),
        ...(config.peerDependencies ? Object.keys(config.peerDependencies) : []),
      ];

      await buildCommand({
        reporter,
        sourceFile,
        entries,
        targets,
        tsconfig,
        externalDependencies,
        resolvePath,
        minify: flags.minify,
        sourcemap: flags.sourcemap,
        imports: {
          web: webImportMaps.imports,
          node: nodeImportMaps.imports,
        },
      });

      const endedAt = performance.now();
      const elapsedTime = endedAt - startedAt;
      reporter.info(`
  ⚡ Done in ${(elapsedTime).toFixed(1)}ms.
  `);

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
