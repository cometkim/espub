#!/usr/bin/env node

import meow from 'meow';

export const cli = meow(`
Usage
  $ nanobundle <command> [input] [options]

Available Commands
  build    Build once and exit

Options
  --version          Displays current version
  --cwd              Use an alternative working directory
  --tsconfig         Specify the path to a custom tsconfig.json
  --import-maps      Specify import map file path  (default: package.json)
  --standalone       Embed external dependencies into the bundle (default: false)
  --external         Specify external dependencies to exclude from the bundle
  --minify           Minify output (default: true)
  --sourcemap        Generate source map (default: true)
  --dts              Generate TypeScript .d.ts files (default: true)
  --help             Displays this message
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
    importMaps: {
      type: 'string',
      default: 'package.json',
    },
    external: {
      type: 'string',
      isMultiple: true,
      default: [],
    },
    standalone: {
      type: 'boolean',
      default: false,
    },
    minify: {
      type: 'boolean',
      default: true,
    },
    sourcemap: {
      type: 'boolean',
      default: true,
    },
    dts: {
      type: 'boolean',
      default: true,
    },
  },
});

export type Flags = typeof cli.flags;
