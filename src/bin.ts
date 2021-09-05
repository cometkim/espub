#!/usr/bin/env node

import { performance } from 'node:perf_hooks';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { cli } from './cli';
import { loadConfig } from './config';
import { loadTargets } from './target';
import type { Reporter } from './report';
import { getEntriesFromConfig } from './entry';
import { buildCommand } from './commands/build';

const { flags, input } = cli;
const [command] = input;

const noop = () => {};
const debugEnabled = process.env.DEBUG === 'true';
const basePath = flags.cwd;

const reporter: Reporter = {
  debug: debugEnabled ? console.log : noop,
  info: console.log,
  warn: console.warn,
  error: console.error,
};

const resolver = (file: string) => path.resolve(basePath, file);

let exitCode = 0;

switch (command) {
  case undefined: {
    cli.showHelp(0);
  }

  case 'build': {
    const startedAt = performance.now();

    const config = await loadConfig({ basePath });
    const sourceFile = config.source && resolver(config.source);
    if (!sourceFile || !fs.existsSync(sourceFile)) {
      throw new Error('`"source"` field must be specified in the package.json');
    }

    reporter.debug(`build ${config.name || 'unnamed'} package`);
    reporter.debug(`load source from ${sourceFile}`);

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
      resolvePath: resolver,
    });

    const externalDependencies = [
      ...(config.dependencies ? Object.keys(config.dependencies) : []),
      ...(config.peerDependencies ? Object.keys(config.peerDependencies) : []),
    ];

    exitCode = await buildCommand({
      reporter,
      sourceFile,
      entries,
      targets,
      tsconfig,
      externalDependencies,
      minify: flags.minify,
      sourcemap: flags.sourcemap,
    })

    const endedAt = performance.now();
    const elapsedTime = endedAt - startedAt;
    reporter.info(`
⚡ Done in ${(elapsedTime).toFixed(1)}ms.
`);

    break;
  }

  case 'watch': {
    reporter.error('sorry, not implemeted yet');
    exitCode = 1;
    break;
  }

  default: {
    reporter.error(`
  Command "${command}" is not available.

  Run \`nanobundle --help\` for more detail.`,
    );
    exitCode = 1;
  }
}

process.exit(exitCode);
