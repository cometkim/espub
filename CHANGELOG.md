# nanobundle

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
