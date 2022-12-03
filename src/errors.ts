export class NanobundleInvalidDtsEntryError extends Error {
  constructor() {
    super('"types" entry must be .d.ts file and cannot be nested!');
  }
}