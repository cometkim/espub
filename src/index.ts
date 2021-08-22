import { cli } from './cli';
import { loadConfig } from './config';
import { buildCommand } from './commands/build';
import { watchCommand } from './commands/watch';

const { flags, input } = cli;
const [command] = input;

const config = await loadConfig({ basePath: flags.cwd });

let exitCode = 0;

switch (command) {
  case undefined: {
    cli.showHelp(0);
  }

  case 'build': {
    exitCode = await buildCommand(config, flags);
    break;
  }

  case 'watch': {
    exitCode = await watchCommand(config, flags);
    break;
  }

  default: {
    console.log(`
  Command "${command}" is not available.

  Run \`nanobundle --help\` for more detail.`,
    );
    exitCode = 1;
  }
}

process.exit(exitCode);
