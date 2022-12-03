export class NanobundleInvalidDtsEntryError extends Error {
  constructor() {
    super('"types" entry must be .d.ts file and cannot be nested!');
  }
}

export class NanobundleInvalidDtsEntryOrderError extends Error {
  constructor() {
    super('"types" entry must occur first in conditional exports for correct type resolution.');
  }
}
