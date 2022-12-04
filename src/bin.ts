#!/usr/bin/env node

import * as path from 'node:path';
import { parse as parseTsConfig } from 'tsconfck';
import dedent from 'string-dedent';

import { cli } from './cli';
import { ConsoleReporter } from './reporter';
import { loadTargets } from './target';
import { loadManifest } from './manifest';
import { parseConfig } from './context';
import { getEntriesFromContext } from './entry';
import * as formatUtils from './formatUtils';
import { NanobundleError } from './errors';

import { buildCommand } from './commands/build/build';

const { flags, input } = cli;
const [command] = input;

const reporter = new ConsoleReporter(console);
reporter.level = process.env.DEBUG === 'true' ? 'debug' : 'default';

const resolve = (cwd: string, subpath: string) => path.resolve(cwd, subpath);

try {
  switch (command) {
    case undefined: {
      cli.showHelp(0);
    }

    case 'build': {
      const manifest = await loadManifest({
        cwd: flags.cwd,
        resolve,
      });
      reporter.info(`build ${manifest.name || 'unnamed'} package`);

      const tsconfigResult = await parseTsConfig(flags.tsconfig, {
        resolveWithEmptyIfConfigNotFound: true,
      });
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
      const targets = await loadTargets({ basePath: flags.cwd });
      const context = parseConfig({
        flags,
        targets,
        manifest,
        tsconfig,
        tsconfigPath,
        resolve,
        reporter,
      });
      reporter.debug(`load targets ${context.targets.join(', ')}`);

      const entries = getEntriesFromContext({
        context,
        reporter,
        resolve,
      });

      await buildCommand({
        context,
        entries,
      });

      break;
    }

    default: {
      throw new NanobundleError(dedent`
        Command "${command}" is not available.

          Run ${formatUtils.command('nanobundle --help')} for usage.
      `);
    }
  }
} catch (error) {
  if (error instanceof NanobundleError) {
    reporter.error(error.message);
  } else {
    reporter.captureException(error);
  }
  process.exit(1);
}
