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
                     This can be configured by tsconfig.json

  --out-dir          Specify the path to resolve source entry (default: ./lib)
                     This can be configured by tsconfig.json

  --tsconfig         Specify the path to a custom tsconfig.json

  --import-maps      Specify import map file path (default: package.json)

  --standalone       Embed external dependencies into the bundle (default: false)

  --external         Specify external dependencies to exclude from the bundle

  --platform         Specify bundle target platform (default: "netural")
                     One of "netural", "browser", "node" is allowed.

  --no-sourcemap     Disable source map generation

  --no-dts           Disable TypeScript .d.ts build

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
