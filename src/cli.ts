#!/usr/bin/env node

import meow from 'meow';

export const cli = meow(`
Usage
  $ nanobundle <command> [options]

Available Commands
  build    Build once and exit
  watch    Rebuilds on any change

Options
  --version          Displays current version
  --cwd              Use an alternative working directory
  --tsconfig         Specify the path to a custom tsconfig.json
  --import-map       Specify import map file path  (default \`imports\` in package.json)
  --external         Specify external dependencies (default \`peerDependencies\` and \`dependencies\` in package.json)
  --compress         Compress output (default: true)
  --sourcemap        Generate source map (default true)
  --help             Displays this message

Examples
`, {
  importMeta: import.meta,
  flags: {
    cwd: {
      type: 'string',
      default: process.cwd(),
    },
    tsconfig: {
      type: 'string',
      default: 'tsconfig.json',
    },
    importMap: {
      type: 'string',
      default: 'package.json',
    },
    external: {
      type: 'string',
      isMultiple: true,
      default: [],
    },
    compress: {
      type: 'boolean',
      default: true,
    },
    sourcemap: {
      type: 'boolean',
      default: true,
    },
  },
});

export type Flags = typeof cli.flags;
