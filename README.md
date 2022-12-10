# nanobundle
[![Version on NPM](https://img.shields.io/npm/v/nanobundle/rc)](https://www.npmjs.com/package/nanobundle)
[![Downlaods on NPM](https://img.shields.io/npm/dm/nanobundle)](https://www.npmjs.com/package/nanobundle)
[![Integration](https://github.com/cometkim/nanobundle/actions/workflows/integration.yml/badge.svg)](https://github.com/cometkim/nanobundle/actions/workflows/integration.yml)
[![codecov](https://codecov.io/gh/cometkim/nanobundle/branch/main/graph/badge.svg?token=6Oj3oxqiyQ)](https://codecov.io/gh/cometkim/nanobundle)
[![LICENSE - MIT](https://img.shields.io/github/license/cometkim/nanobundle)](#license) <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

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

See [feature comparison](#feature-comparison) for more detail.

## Usage

**You don't need any config files or passing the entry paths. But only you need to have proper [`package.json`](https://nodejs.org/api/packages.html) (and `tsconfig.json`)**

```jsonc
{
  "main": "./lib/index.js",
  "scripts": {
    "build": "nanobundle build"
  }
}
```

That's it, then just run `yarn build` or `npm run build`. What a magic ✨

nanobundle is smart enough to automatically determine the location of the appropriate source files from the entries specified in your `package.json`.

It searches based on the `--root-dir` and `--out-dir` on the CLI flags (defaults to `src` and `lib`) but respects `tsconfig.json` if present.

### `package.json` Recipes

More interestingly, it supports all of Node.js' notoriously complex **[Conditional Exports](https://nodejs.org/api/packages.html#conditional-exports)** rules.

<details>
  <summary>The ESM-only approach</summary>
  
  ```jsonc
  {
    "type": "module",
    "main": "./lib/index.js",    // => src/index.ts
    "module": "./lib/index.js",  // => src/index.ts
    "exports": "./lib/index.js"  // => src/index.ts
  }
  ```

</details>


<details>
  <summary>Dual-package exports</summary>
  
  ```jsonc
  {
    "exports": {
      ".": {
        "types": "./lib/index.d.ts",     // => src/index.ts
        "require": "./lib/index.js",     // => src/index.ts
        "import": "./lib/index.mjs"      // => src/index.mts or src/index.ts
      },
      "./package.json": "./package.json" // => package.json
    }
  }
  ```

</details>


<details>
  <summary>Mutliple platform support</summary>
  
  ```jsonc
  {
    "exports": {
      ".": {
        "node": {
          "require": "./lib/index.node.cjs",  // => src/index.node.cts or src/index.node.ts
          "import": "./lib/index.node.mjs"    // => src/index.node.mts or src/index.node.ts
        },
        "deno": "./lib/index.deno.mjs",       // => src/index.deno.mts or src/index.deno.ts
        "browser": "./lib/index.browser.mjs", // => src/index.browser.mts or src/index.browser.ts
        "default": "./lib/index.js"           // => src/index.ts
      },
      "./package.json": "./package.json"      // => package.json
    }
  }
  ```

</details>


<details>
  <summary>Server/Client submodules</summary>
  
  ```jsonc
  {
    "exports": {
      ".": "./lib/common.js",          // => src/common.ts
      "./server": {
        "types": "./lib/server.d.ts",  // => src/server.ts
        "require": "./lib/server.cjs", // => src/server.cts or src/server.ts
        "import": "./lib/server.mjs"   // => src/server.mts or src/server.ts
      },
      "./client": {
        "types": "./lib/client.d.ts",      // => src/client.ts
        "require": "./lib/client.min.cjs", // => src/client.cts or src/client.ts, output will be minified:sparkles:
        "import": "./lib/client.min.mjs"   // => src/client.mts or src/client.ts, output will be minified
      },
      "./package.json": "./package.json"
    }
  }
  ```

</details>


<details>
  <summary>Development-only code for debugging</summary>
  
  ```jsonc
  {
    "exports": {
      "development": "./dev.js",     // => src/dev.ts
      "production": "./index.min.js" // => src/index.ts, output will be minified
    }
  }
  ```

</details>


### CLI Options

<details>
  <summary>Full CLI options</summary>
  
  ```
  Usage
    $ nanobundle <command> [options]

  Available Commands
    build    Build once and exit

  Options
    --version            Display current version

    --cwd                Use an alternative working directory

    --tsconfig           Specify the path to a custom tsconfig.json

    --import-maps        Specify import map file path (default: package.json)

    --root-dir           Specify the path to resolve source entry (default: ./src)
                         This also can be configured by tsconfig.json

    --out-dir            Specify the path to resolve source entry (default: ./lib)
                         This also can be configured by tsconfig.json

    --platform           Specify bundle target platform (default: "netural")
                         One of "netural", "browser", "node" is allowed

    --standalone         Embed external dependencies into the bundle (default: false)

    --external           Specify external dependencies to exclude from the bundle

    --jsx                Specify JSX mode. One of "transform", "preserve", "automatic" is allowed
                         This also can be configufeature comparisonred by tsconfig.json

    --jsx-factory        Specify JSX factory (default: "React.createElement")
                         This also can be configured by tsconfig.json

    --jsx-fragment       Specify JSX <Fragment> factory (default: "Fragment")
                         This also can be configured by tsconfig.json

    --jsx-import-source  Specify JSX import source (default: "react")
                         This also can be configured by tsconfig.json

    --no-sourcemap       Disable source map generation

    --no-dts             Disable TypeScript .d.ts build

    --verbose            Set to report build result more verbosely

    --help               Display this message
  ```
</details>

## Features

Nanobundle believes the `package.json` today is expressive enough for most module use cases.

So attempting to turn users' attention back to the [Node's package spec](https://nodejs.org/api/packages.html) and some meaningful proposals like [ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and [Import Maps](https://wicg.github.io/import-maps/) which are already supported by Node.js, rather than adding another customizing options.

### Automatic entry pointsfeature comparison

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

**nanobundle expects you to write a Web-compatible(netural) package.**

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

nanobundle also handles Node.js's [Subpath Imports](https://nodejs.org/api/packages.html#subpath-imports) rules.

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

## Feature Comparison

| Build tool           | 0 Config                         | Respect `package.json` | TypeScript `.d.ts` generation | Concurrency | Multiple Entries         | Conditional Exports  | Import Maps            | CSS Support            | Plugins          | Dev(watch) mode  |
| :------------------- | -------------------------------: | ---------------------: | ----------------------------: | ----------: | -----------------------: | -------------------: | ---------------------: | ---------------------: | ---------------: | ---------------: |
| **nanobundle**       | ✔️                                | ✔️                      | ✔️                             | ✔️           | ✔️                        | ✔️                    | ✔️                      | ✖️ <br> (planned)       | ✖️ <br> (planned) | ✖️ <br> (planned) |
| [microbundle]        | ✔️                                | ✔️                      | ✔️                             | ✔️           | ✖️                        | 🟡 <br> (only flat)  | ✖️                      | ✔️                      | ✖️                | ✔️                |
| [tsup]               | 🟡 <br> (mostly by custom file)  | ✖️                      | ✔️                             | ✔️           | ✔️                        | ✖️                    | 🟡 <br> (with plugin)  | 🟡 <br> (experimental) | ✔️                | ✔️                |
| [estrella]           | ✖️                                | ✖️                      | ✔️                             | ✔️           | ✖️                        | ✖️                    | ✖️                      | ✖️                      | ✖️                | ✔️                |
| [esbuild]            | ✖️                                | ✖️                      | ✖️                             | ✔️           | ✔️                        | ✖️                    | ✖️                      | ✔️                      | ✔️                | ✔️                |
| [Rollup]             | ✖️                                | ✖️                      | 🟡 <br> (with plugin)         | ✔️           | ✔️                        | 🟡 <br> (by code)    | 🟡 <br> (with plugin)  | ✔️                      | ✔️                | ✔️                |
| [Vite (lib mode)]    | ✖️                                | ✖️                      | 🟡 <br> (with plugin)         | ✔️           | ✔️                        | 🟡 <br> (by code)    | 🟡 <br> (with plugin)  | ✔️                      | ✔️                | ✔️                |
| [Parcel (lib mode)]  | ✔️                                | ✔️                      | ✔️                             | ✔️           | ✖️                        | ✖️                    | ✖️                      | ✔️                      | ✖️                | ✔️                |


## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://blog.cometkim.kr/"><img src="https://avatars.githubusercontent.com/u/9696352?v=4?s=100" width="100px;" alt="Hyeseong Kim"/><br /><sub><b>Hyeseong Kim</b></sub></a><br /><a href="https://github.com/cometkim/nanobundle/commits?author=cometkim" title="Code">💻</a> <a href="#maintenance-cometkim" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/eolme"><img src="https://avatars.githubusercontent.com/u/11076888?v=4?s=100" width="100px;" alt="Anton Petrov"/><br /><sub><b>Anton Petrov</b></sub></a><br /><a href="https://github.com/cometkim/nanobundle/commits?author=eolme" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.easylogic.studio/"><img src="https://avatars.githubusercontent.com/u/591983?v=4?s=100" width="100px;" alt="jinho park"/><br /><sub><b>jinho park</b></sub></a><br /><a href="https://github.com/cometkim/nanobundle/commits?author=easylogic" title="Tests">⚠️</a> <a href="https://github.com/cometkim/nanobundle/issues?q=author%3Aeasylogic" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## License

MIT

[microbundle]: https://github.com/developit/microbundle
[tsup]: https://tsup.egoist.sh/
[estrella]: https://github.com/rsms/estrella
[esbuild]: https://esbuild.github.io/
[Rollup]: https://rollupjs.org/guide/
[Vite (lib mode)]: https://vitejs.dev/guide/build.html#library-mode
[Parcel (lib mode)]: https://parceljs.org/getting-started/library/
