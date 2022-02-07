# nanobundle

[![Version on NPM](https://img.shields.io/npm/v/nanobundle)](https://www.npmjs.com/package/nanobundle)
[![Downlaods on NPM](https://img.shields.io/npm/dm/nanobundle)](https://www.npmjs.com/package/nanobundle)
[![LICENSE - MIT](https://img.shields.io/github/license/cometkim/nanobundle)](#license)

Yet another build tool for libraries, powered by [esbuild]

## Features

- Support for ESM and CommonJS
- Support [Import Maps](https://wicg.github.io/import-maps/)
- Find and optimize the esbuild options for you
- Only configuration you need is `package.json` (and optionally `tsconfig.json`)

## Installation

1. Install by running `yarn add -D nanobundle` or `npm i -D nanobundle`

2. Setup your `package.json`:
   ```jsonc
   {
     "name": "your-package-name",

     "source": "./src/foo.ts",        // required, the entry source file

     "module": "./dist/foo.mjs",    // where to generate the ESM bundle
     "main": "./dist/foo.cjs",      // where to generate the main entry (CommonJS by default, or ESM if `"type": "module"` and not `*.cjs`)

     "imports": {                   // import maps for modules/paths alias
       // ...
     },

     "exports": {                   // export maps for multiple/conditional entries
       // ...
     },

     "scripts": {
       "build": "nanobundle build"  // compiles "source" to "main"/"module"
     }
   }
   ```

3. Try it out by running `yarn build` or `npm run build`

## Usage & Configuration

nanobundle is heavily inspired by [microbundle], but more daring to try to remove the configuration much as possible. I believe the `package.json` today is complex enough and already contains most of the configuration for common module use cases.

So attempting to turn users' attention back to the [Node's package spec](https://nodejs.org/api/packages.html) and some meaningful proposals like [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [Import maps](https://wicg.github.io/import-maps/) which are already supported by Node.js, rather than another custom configuration.

### Build targets

**nanobundle expects you to write a Web-compatible package.**

If you use any Node.js APIs, you need to tell it explicitly via:.
- Set the entry point with `.cjs` or `.node` extension
- Specify Node.js version via `engines` field in the `package.json`

Without `engines`, the default target will be Node.js v14.

### Import Map

nanobundle supports [Import maps](https://wicg.github.io/import-maps/)

You can specify import alias by your `package.json`, or by a separated json file with the `--import-map` option.

```jsonc
{
  "imports": {
    "~/": "./",
    "@util/": "./src/utils/",

    // Node.js-style conditional imports
    "#dep": {
      "default": "./dep-polyfill.js",
      "node": "dep-node-native"
    }
  }
}
```

### Export Map

You can specify multiple/conditional entry points in your `package.json`.

See [Node.js docs](https://nodejs.org/api/packages.html#packages_package_entry_points) for more detail.

```jsonc
{
  "type": "module",
  "main": "./main.js",
  "exports": {
    ".": "./main.js",
    "./feature": {
      "default": "./feature.js",
      "node": "./feature-node.js"
    }
  }
}
```

### Embedding dependencies

nanobundle by default does nothing about external like `dependencies` and `peerDependencies`.

However, if the `--standalone` flag is set, it will try to embed all external dependencies into the bundle.

Dependencies specified with `--external` and Node.js internal APIs are always excluded.

### TypeScript

Given a `tsconfig.json` file in the cwd or `--tsconfig` option, nanobundle looks for options for TypeScript and JSX.

You can specify `declarationDir` in your tsconfig, or nanobundle infer the dir from `types` entry.

nanobundle automatically generate TypeScript declaration as you specify `types` entry in the `package.json`, or you can disable it passing `--dts=false` argument.

## Alternatives

- [microbundle] : Rollup wrapper that provides similar concept
- [esbuild] : This is a simple esbuild wrapper so you can get similar results with just esbuild alone
- [estrella] : Build tool based on esbuild
- [tsup] : Zero-config bundler based on esbuild

## License

MIT

[esbuild]: https://esbuild.github.io/
[microbundle]: https://github.com/developit/microbundle
[estrella]: https://github.com/rsms/estrella
[tsup]: https://tsup.egoist.sh/
