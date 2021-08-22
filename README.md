# nanobundle

Yet another zero-configuration bundler for tiny modules, powered by [esbuild]

Thanks to [microbundle] for saving my days, but we can save even more days with [esbuild]!

## Features

- Support for ESM and CommonJS
- Find and optimize the esbuild options for you
- Only configuration you need is `package.json` (and optionally `tsconfig.json`)

## Installation

1. Install by running `yarn add -D nanobundle` or `npm i -D nanobundle`

2. Setup your `package.json`:
   ```jsonc
   {
     "name": "your-package-name",

     "source": "src/foo.ts",        // required, the entry source file
     "module": "./dist/foo.mjs",    // where to generate the ESM bundle
     "main": "./dist/foo.cjs",      // where to generate the main entry (CommonJS by default, or ESM if `"type": "module"` and not `*.cjs`)
     "bin": "./dist/foo.cjs",       // where to generate the binary entry (CommonJS by default, or ESM if `"type": "module"` and not `*.cjs`)

     "imports": {                   // import maps for modules/paths alias
       // ...
     },

     "exports": {                   // export maps for multiple/conditional entries
       // ...
     },

     "scripts": {
       "build": "nanobundle build", // compiles "source" to "main"/"module"
       "dev": "nanobundle watch"    // re-build when source files change
     }
   }
   ```

3. Try it out by running `yarn build` or `npm run build`

## Usage & Configuration

This is inspired by microbundle, but more daring to try to remove the configuration much as possible. I believe the `package.json` today is huge enough and already contains most of the configuration for common modules.

Most of the options depend on features already supported by esbuild.

### Build targets

**nanobundle expects you to write a Web-compatible package. If you use the Node.js API, you need to tell it explicitly.**

When is build target set to Node.js:
- If you use entry point with `.cjs` extension
- If you specify Node.js version in `package.json`

Otherwise, it is assumed to be Web target.

#### Node.js target

If you specify the Node.js version via `engines` in your `package.json`, the build target is automatically set to that node version.

```jsonc
{
  "engines": {
    "node": ">=14"
  }
}
```

For cjs entry points set Node v14 by default.

### Import Map

nanobundle supports [import maps](https://github.com/WICG/import-maps)!

You can specify import alias by your `package.json`, or by a separated json file with the `--import-map` option.

```jsonc
{
  "imports": {
    "~/": "./",
    "@util/": "./src/utils/",

    // Conditional imports for Node.js environment
    "#dep": {
      "default": "./dep-polyfill.js",
      "node": "dep-node-native"
    }
  }
}
```

### Export Map

You can specify multiple/conditional entry points in your `package.json`.

See [Node.js docs](https://nodejs.org/api/packages.html#packages_package_entry_points) for more detail

```jsonc
{
  "main": "./main.js",
  "exports": {
    ".": "./main.js",
    "./feature": {
      "default": "./feature.mjs",
      "import": "./feature.mjs",
      "require": "./feature.cjs",
      "node": "./feature.cjs"
    }
  }
}
```

nanobuild emit bundles at all specified entry points.

### TypeScript

Given a `tsconfig.json` file in the cwd or `--tsconfig` option, nanobundle looks for options for TypeScript and JSX.

You can specify `declarationDir` in your tsconfig, or nanobundle infer the dir from `types` entry.

## Alternatives

- [microbundle] : Rollup wrapper that provides similar concept
- [esbuild] : This is a simple esbuild wrapper so you can get similar results with just esbuild alone.
- [estrella] : Build tool based on esbuild
- [tsup] : Zero-config bundler based on esbuild

## License

MIT

[esbuild]: https://esbuild.github.io/
[microbundle]: https://github.com/developit/microbundle
[estrella]: https://github.com/rsms/estrella
[tsup]: https://tsup.egoist.sh/
