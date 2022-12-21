#!/usr/bin/env node

import * as path from 'node:path';
import { parse as parseTsConfig } from 'tsconfck';
import dedent from 'string-dedent';

import { cli } from './cli';
import { ConsoleReporter } from './reporter';
import { loadTargets } from './target';
import { loadManifest } from './manifest';
import { NanobundleConfigError, parseConfig } from './context';
import { getEntriesFromContext } from './entry';
import * as formatUtils from './formatUtils';
import { NanobundleError } from './errors';

import { buildCommand } from './commands/build';
import { cleanCommand } from './commands/clean';

const { flags, input } = cli;
const [command] = input;

const reporter = new ConsoleReporter(console);
reporter.level = process.env.DEBUG === 'true' ? 'debug' : 'default';

const resolve = (cwd: string, subpath: string) => path.resolve(cwd, subpath);

if (!command) {
  cli.showHelp(0);
}

const supportedCommands = ['build', 'clean'];

try {
  if (supportedCommands.includes(command)) {
    const manifest = await loadManifest({
      cwd: flags.cwd,
      resolve,
    });
    reporter.debug('loaded manifest %o', manifest);

    const tsconfigResult = await parseTsConfig(flags.tsconfig, {
      resolveWithEmptyIfConfigNotFound: true,
    });
    const tsconfigPath = (
      tsconfigResult.tsconfigFile !== 'no_tsconfig_file_found'
        ? tsconfigResult.tsconfigFile
        : undefined
    );
    if (tsconfigPath) {
      reporter.debug(`loaded tsconfig from ${tsconfigPath}`);
    }
    const tsconfig = (
      tsconfigResult.tsconfigFile !== 'no_tsconfig_file_found'
        ? tsconfigResult.tsconfig
        : undefined
    );
    if (tsconfig) {
      reporter.debug('loaded tsconfig %o', tsconfig);
    }

    const targets = await loadTargets({ basePath: flags.cwd });
    reporter.debug(`loaded targets ${targets.join(', ')}`);

    const context = parseConfig({
      flags,
      targets,
      manifest,
      tsconfig,
      tsconfigPath,
      resolve,
      reporter,
    });
    reporter.debug(`loaded context %o`, context);

    const entries = getEntriesFromContext({
      context,
      reporter,
      resolve,
    });

    if (
      entries.some(entry => entry.module === 'dts') &&
      tsconfigPath == null
    ) {
      throw new NanobundleConfigError(dedent`
        You have set ${formatUtils.key('types')} entry. But no ${formatUtils.path('tsconfig.json')} found.

          Please create ${formatUtils.path('tsconfig.json')} file in the current directory, or pass its path to ${formatUtils.command('--tsconfig')} argument.

      `);
    }

    reporter.debug(`parsed entries %o`, entries);

    if (command === 'build') {
      reporter.info(dedent`
        build ${formatUtils.highlight(manifest.name || 'unnamed')} package

      `);
      await buildCommand({ context, entries });
    }

    if (command === 'clean') {
      await cleanCommand({ context, entries });
    }

  } else {
    throw new NanobundleError(dedent`
      Command "${command}" is not available.

        Run ${formatUtils.command('nanobundle --help')} for usage.
    `);
  }
} catch (error) {
  if (error instanceof NanobundleError) {
    if (error.message) {
      reporter.error(error.message);
    }
  } else {
    reporter.captureException(error);
  }
  process.exit(1);
}
