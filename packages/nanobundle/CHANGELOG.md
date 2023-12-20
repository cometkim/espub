# nanobundle

## 2.0.1

### Patch Changes

- c5855c7: Update package info

## 2.0.0

### Major Changes

- 7bf90bf: Drop Node'js < v18 and TypeScript < v5 as required by tsconfck v3. (#224)
- dbe79a0: Set default target Node.js version to v18.0.0
- 03ce072: Deprecate the `--platform` flag to specify default target platform

### Minor Changes

- 24d37be: Better support for Deno target transform
- fb11c28: Update esbuild to v0.19
- 24d37be: Reduce bloats on output for deno

### Patch Changes

- d2ed35b: Fix target option specified properly
- f38bb52: Update browserslist

## 1.6.0

### Minor Changes

- a3b954c: update esbuild
- ff6a370: update esbuild
- 4946b5c: Support TypeScript v5

### Patch Changes

- 3d07b82: Fix standalone mode (embedding externals)

## 1.5.1

### Patch Changes

- 680ff26: Add support for `modulde`-packages with `.cts` entrypoints and `commonjs` packages with `.mts` entrypoints

## 1.5.0

### Minor Changes

- a546f4d: Support defined value `process.env.NANABUNDLE_PACKAGE_NAME` and `process.env.NANOBUNDLE_PACKAGE_VERSION`

## 1.4.0

### Minor Changes

- b71eeef: Add --no-legal-comments to disable emitting legal text
- 0ab2a4a: Support CSS bundle explicitly
- 745a02c: Don't emit empty legal comments

## 1.3.6

### Patch Changes

- 4559578: regression: emit sourcemap by default

## 1.3.5

### Patch Changes

- bcafa5f: Fix to output files with .mjs/.cjs extension properly

## 1.3.4

### Patch Changes

- 1c6dc99: regression: allow directory style importMaps

## 1.3.3

### Patch Changes

- 0b85f38: Fix subpath pattern imports resolution

## 1.3.2

### Patch Changes

- 95ee87d: Fix legal comments output path

## 1.3.1

### Patch Changes

- 8f22759: Fix subpath pattern validation for importMaps

## 1.3.0

### Minor Changes

- 28d0d02: upgrade esbuild to v0.17.x
- 74182e0: Set --keep-names build flag by default
- 684408c: Support custom condition for imports & exports entries
- 7d8f1bf: support subpath pattern import maps
- 7fb6b21: Set legal comments to be liked by default

## 1.2.2

### Patch Changes

- e0f874d: Unhandle .cjsx and .mjsx which are unsupported extension by TypeScript

  See [TS6054](https://github.com/search?q=repo%3Amicrosoft%2FTypeScript%20ts6054&type=code)
  See also https://github.com/microsoft/TypeScript/issues/44442

## 1.2.1

### Patch Changes

- 7f4d5c1: Fix output filenames for CSS bundles

## 1.2.0

### Minor Changes

- ae45ed3: Add --no-bundle flag to disable bundle build
- 27b11c3: Allow source file with specific conditiona key

## 1.1.0

### Minor Changes

- 41414c0: Add --clean flag to build command
- 8561c0b: Prioritize jsx extension over module format if enabled
- 36c9d4b: upgrade esbuild
- 41414c0: Add `nanobundle clean` command
- a77652d: Allow JSX extension entries (resolves #76)

### Patch Changes

- 6aca469: Fix to respect tsconfig's sourceMap option
- 6aca469: Fix the `--no-sourcemap` option to work properly
- 31ae8d3: Fix crash on project using Node16 and NodeNext in tsconfig.json

  For this, nanobundle temporarily uses forked version of tsconfck package.

- 41414c0: fix directory cleanup don't remove cwd
- 39ead88: chore: error message typo
- 2dcbba7: update tsconfck

## 1.0.0

### Major Changes

- c6fad2b: v1 features

  - support multiple entries
  - support nested conditional exports
  - source inference from rootDir and outDir
  - enable tree-shaking by default
  - pretty reporter

### Patch Changes

- 8ad0d33: more debug logs
- 7426fd6: fix build flags and help text
- a7c3312: Fix internal error handling
- d14d8d5: add padding to warn/error messages
- a187ab5: fix implicit types entry not to be conflicted with others
- 7af4bf4: polished error messages and validation
- ad38773: Fix flag test on jsx options
- a57385d: fix result to be reported properly
- c2d75a8: fix boolean flag handling
- c3284bc: prettify result report
- 1f5c2d3: fix sourcemap output path
- c910f0c: fix indentation on typescript diagnostics
- 7762b4a: Support Node.js resolution for import maps
- 6976909: fix dts generation
- 67b74ef: Fix TypeScript build task
- ea2782f: Support JSX sources
- a414231: change pathLike string colors"
- 781557a: fix things
- 47f8eef: more compact logs
- fde48ba: polished reporting and diagnostics
- e6d2499: fix dts build option
- 84c8214: Fix to make it failed on type errors
- 2075f16: compact reporting while on verbose mode
- 31124fe: fix to --no-dts properly skip buildTypeTask
- d5ed671: Fix jsx transform to work with additional options
- d4e84bc: update depdencies
- 4918a88: Fix TypeScript declartion build and prettify reporting
- 12d5305: normalize ts rootDir and outDir

## 1.0.0-rc.15

### Patch Changes

- 47f8eef: more compact logs

## 1.0.0-rc.14

### Patch Changes

- c910f0c: fix indentation on typescript diagnostics
- 6976909: fix dts generation
- fde48ba: polished reporting and diagnostics
- 84c8214: Fix to make it failed on type errors
- 2075f16: compact reporting while on verbose mode
- 12d5305: normalize ts rootDir and outDir

## 1.0.0-rc.13

### Patch Changes

- ad38773: Fix flag test on jsx options
- d5ed671: Fix jsx transform to work with additional options

## 1.0.0-rc.12

### Patch Changes

- ea2782f: Support JSX sources

## 1.0.0-rc.11

### Patch Changes

- 7762b4a: Support Node.js resolution for import maps

## 1.0.0-rc.10

### Patch Changes

- 7af4bf4: polished error messages and validation
- c2d75a8: fix boolean flag handling
- 31124fe: fix to --no-dts properly skip buildTypeTask

## 1.0.0-rc.9

### Patch Changes

- a7c3312: Fix internal error handling

## 1.0.0-rc.8

### Patch Changes

- a414231: change pathLike string colors"
- d4e84bc: update depdencies
- 4918a88: Fix TypeScript declartion build and prettify reporting

## 1.0.0-rc.7

### Patch Changes

- 67b74ef: Fix TypeScript build task

## 1.0.0-rc.6

### Patch Changes

- a57385d: fix result to be reported properly

## 1.0.0-rc.5

### Patch Changes

- c3284bc: prettify result report

## 1.0.0-rc.4

### Patch Changes

- 7426fd6: fix build flags and help text
- 1f5c2d3: fix sourcemap output path
- e6d2499: fix dts build option

## 1.0.0-rc.3

### Patch Changes

- 781557a: fix things

## 1.0.0-rc.2

### Patch Changes

- d14d8d5: add padding to warn/error messages
- a187ab5: fix implicit types entry not to be conflicted with others

## 1.0.0-rc.1

### Patch Changes

- 8ad0d33: more debug logs

## 1.0.0-rc.0

### Major Changes

- c6fad2b: v1 features

  - support multiple entries
  - support nested conditional exports
  - source inference from rootDir and outDir
  - enable tree-shaking by default
  - pretty reporter

## 0.0.28

### Patch Changes

- 6e07e74: Fix types generation

## 0.0.27

### Patch Changes

- 4eed241: choose prefered target based on module type specified by "exports" entry
- 127cf17: ignore android 4.4 target

## 0.0.26

### Patch Changes

- ad3caf9: update browserslist
- 761a11d: update esbuild
- edf2458: update tsconfck
- 4b284a0: fix build target resolutions

  - Support `ios_safari`, `android`, `and_chr` and `and_ff` query
  - Drop `deno` query

## 0.0.25

### Patch Changes

- 7b4a7ba: Update dependencies

## 0.0.24

### Patch Changes

- 31b11f7: Fixes packages with names similar to Node.js APIs are not properly embedded.

## 0.0.23

### Patch Changes

- 3563009: Fixes packages with names similar to Node.js APIs are not properly embedded.

## 0.0.22

### Patch Changes

- a19162b: update dependencies
- 204cc76: Ignore noEmit option when `types` entry required

## 0.0.21

### Patch Changes

- ccf3a06: upgrade dependencies

## 0.0.20

### Patch Changes

- 522a039: Fix "Unexpected moduleResolution" on emitting dts

## 0.0.19

### Patch Changes

- 27327c5: Don't emit dts files when "types" is not exist in package.json
- 78bd184: feat: emit TypeScript declaration files"

## 0.0.18

### Patch Changes

- 25e3996: fix standalone mode

## 0.0.17

### Patch Changes

- fac2b8c: fix internal reference in embedding process
