# nanobundle

[![Version on NPM](https://img.shields.io/npm/v/nanobundle/rc)](https://www.npmjs.com/package/nanobundle)
[![Downlaods on NPM](https://img.shields.io/npm/dm/nanobundle)](https://www.npmjs.com/package/nanobundle)
[![LICENSE - MIT](https://img.shields.io/github/license/cometkim/nanobundle)](#license)

Perfect build tool for libraries, powered by [esbuild]

**Nanobundle is currently testing in RC version, feel free to leave feedback on the issue tracker!**

## Features

- Automatic entry points
- Support for **ESM** and **CommonJS**
- Support **TypeScript `NodeNext`** moduleResolution
- Support **multple** & **complex** entries by Node.js's **[Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports)**
- Support **[Import Maps](https://wicg.github.io/import-maps/)** with Node.js's **[Subpath Imports](https://nodejs.org/api/packages.html#subpath-imports)** rule
- Optimize esbuild options to **maximize concurrency**
- Only configuration you need is **`package.json`** (and optionally **`tsconfig.json`**)

## Installation

1. Install by running `yarn add -D nanobundle` or `npm i -D nanobundle`

2. Setup your `package.json`:
   ```jsonc
   {
     "name": "your-package-name",

     // conditional exports for entries
     "exports": {
       "./client": {
         "types": "./lib/client.d.ts",
         "require": "./lib/client.min.js",
         "import": "./lib/client.min.mjs"
       },
       "./server": {
         "types": "./lib/server.d.ts",
         "require": "./lib/server.js",
         "import": "./lib/server.mjs"
       },
       "./package.json": "./package.json"
     },

     "scripts": {
       "build": "nanobundle build"
     }
   }
   ```

3. Try it out by running `yarn build` or `npm run build`

## Usage & Configuration

nanobundle is heavily inspired by [microbundle], but more daring to try to remove the configuration much as possible. I believe the `package.json` today is complex enough and already contains most of the configuration for common module use cases.

So attempting to turn users' attention back to the [Node's package spec](https://nodejs.org/api/packages.html) and some meaningful proposals like [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [Import Maps](https://wicg.github.io/import-maps/) which are already supported by Node.js, rather than adding another customizing options.

### Automatic entry points

You don't need to pass or set entry points in any configuration file, only you have to do is provide correct `exports` in your `package.json`.

nanobundle will automatically search for entry files in the `rootDir` and `outDir` you have. (defaults are `src` and `lib`, or respectively configurable by `tsconfig.json` or CLI arguments)

```jsonc
{
  "main": "./lib/index.js",         // => search src/index.cts, src/index.ts, etc
  "module": "./lib/index.mjs",      // => search src/index.mts, src/index.ts, etc
  "exports": {
    "./feature": "./lib/feature.js" // => search src/feature.cts, src/feature.ts, etc
  }
}
```

### Build targets

**nanobundle expects you to write a Web-compatible package.**

If you use any Node.js APIs, you need to tell it explicitly via:.
- Pass `--platform=node` flag
- Set the entry point with `node` condition.

Without `engines` field in `package.json`, the default Node.js version will be v14.

### Conditional Exports

You can specify multiple/conditional entry points in your `package.json`.

See [Node.js docs](https://nodejs.org/api/packages.html#packages_package_entry_points) for more detail.

```jsonc
{
  "type": "module",
  "main": "./main.js", // Legacy entry
  "exports": {
    ".": "./main.js",
    "./feature": {
      "node": "./feature-node.js", // conditional entry
      "default": "./feature.js"
    }
  }
}
```

You can use conditional exports for dealing with **[Dual Package Hazard](https://nodejs.org/api/packages.html#dual-package-hazard)**. E.g. for supporting both CommonJS and ESM package.

```jsonc
{
  "exports": {
    "require": "./lib/index.cjs",
    "import": "./lib/index.mjs"
  }
}
```

### Import Maps

nanobundle supports [Import Maps](https://wicg.github.io/import-maps/)

You can specify import alias by your `package.json`, or by a separated json file with the `--import-map` option.

```jsonc
{
  "imports": {
    "~/": "./",
    "@util/": "./src/utils/",
  }
}
```

nanobundle also handles Node.js's [Subpath Imports](https://nodejs.org/api/packages.html#subpath-imports) rule.

```jsonc
{
  "imports": {
    "#dep": {
      "node": "dep-node-native",
      "default": "./dep-polyfill.js"
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

nanobundle automatically generate TypeScript declaration as you specify `types` entries in the `package.json`, or you can disable it passing `--no-dts` flag.

### Minification

Any entires with `.min.(c|m)?js` will generate minified output.

```jsonc
{
  "exports": "./index.min.js"  // will be minifies output
}
```

### Using `process.env.NODE_ENV` with condition

Conditional entries with Node.js community condition `production` or `development` will be built with injected `process.env.NODE_ENV` as its value.

```jsonc
{
  "exports": {
    ".": {
      "development": "./dev.js",     // process.env.NODE_ENV === 'development'
      "production": "./prod.min.js"  // process.env.NODE_ENV === 'production'
    }
  }
}
```

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
