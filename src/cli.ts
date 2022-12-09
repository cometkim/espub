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

  --tsconfig         Specify the path to a custom tsconfig.json

  --import-maps      Specify import map file path (default: package.json)

  --root-dir         Specify the path to resolve source entry (default: ./src)
                     This also can be configured by tsconfig.json

  --out-dir          Specify the path to resolve source entry (default: ./lib)
                     This also can be configured by tsconfig.json

  --jsx              Specify JSX mode. One of "preserve", "automatic" is allowed.
                     This also can be configured by tsconfig.json

  --platform         Specify bundle target platform (default: "netural")
                     One of "netural", "browser", "node" is allowed.

  --standalone       Embed external dependencies into the bundle (default: false)

  --external         Specify external dependencies to exclude from the bundle

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
    jsx: {
      type: 'string',
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
