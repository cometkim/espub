#!/usr/bin/env node

import meow from 'meow';

export const cli = meow(`
Usage
  $ nanobundle <command> [options]

Available Commands
  build    Build once and exit

Options
  --version          Display current version

  --cwd              Use an alternative working directory

  --root-dir         Specify the path to resolve source entry (default: ./src)
                     This can be overriden by tsconfig.json

  --out-dir          Specify the path to resolve source entry (default: .)
                     This can be overriden by tsconfig.json

  --tsconfig         Specify the path to a custom tsconfig.json

  --import-maps      Specify import map file path  (default: package.json)

  --standalone       Embed external dependencies into the bundle (default: false)

  --external         Specify external dependencies to exclude from the bundle

  --sourcemap        Generate source map (default: true)

  --dts              Generate TypeScript .d.ts files (default: true)

  --help             Display this message
`, {
  importMeta: import.meta,
  flags: {
    cwd: {
      type: 'string',
      default: process.cwd(),
    },
    rootDir: {
      type: 'string',
    },
    outDir: {
      type: 'string',
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
    platform: {
      type: 'string',
    },
    standalone: {
      type: 'boolean',
      default: false,
    },
    noSourcemap: {
      type: 'boolean',
      default: false,
    },
    noDts: {
      type: 'boolean',
      default: false,
    },
  },
});

export type Flags = typeof cli.flags;
