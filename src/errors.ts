import dedent from 'string-dedent';

import * as formatUtils from './formatUtils';

export class NanobundleError extends Error {
}

export class NanobundleInvalidDtsEntryError extends NanobundleError {
  constructor() {
    super('"types" entry must be .d.ts file and cannot be nested!');
  }
}

export class NanobundleInvalidDtsEntryOrderError extends NanobundleError {
  constructor() {
    super('"types" entry must occur first in conditional exports for correct type resolution.');
  }
}

export class NanobundleConfusingDtsEntryError extends NanobundleError {
  constructor(key: string, requirePath: string, importPath: string) {
    super(dedent`
      ${formatUtils.key('types')} entry doesn't set properly for ${formatUtils.key(key)}:

          "require": "${requirePath}",
          "import": "${importPath}"

      Solution 1. Explicitly set ${formatUtils.key('types')} entry

          "require": {
            "types": "${requirePath.replace(/\.(m|c)?js$/, '.d.$1ts')}",
            "default": "${requirePath}"
          },
          "import": {
            "types": "${importPath.replace(/\.(m|c)?js$/, '.d.$1ts')}",
            "default": "${importPath}"
          }

      Solution 2. Add ${formatUtils.key('default')} entry

          "require": "${requirePath}",
          "import": "${importPath}",
        + "default": "/path/to/entry.js"

    `);
  }
}