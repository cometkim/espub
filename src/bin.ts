#!/usr/bin/env node

import * as path from 'node:path';
import { parse as parseTsConfig } from 'tsconfck';
import dedent from 'string-dedent';

import { cli } from './cli';
import { Reporter } from './reporter';
import { loadTargets } from './target';
import { loadManifest } from './manifest';
import { parseConfig } from './context';
import { getEntriesFromContext } from './entry';
import { buildCommand } from './commands/build/build';

const { flags, input } = cli;
const [command] = input;

const reporter = new Reporter(console);
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
      reporter.debug(`load targets ${targets.join(', ')}`);

      const context = parseConfig({
        flags,
        targets,
        manifest,
        tsconfig,
        tsconfigPath,
        resolve,
        reporter,
      });

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
      throw new Error(dedent`
        Command "${command}" is not available.

        Run \`nanobundle --help\` for more detail.
      `);
    }
  }
} catch (error) {
  reporter.captureError(error);
  process.exit(1);
}
