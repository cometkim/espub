import type { Entry } from './entry';

export type EntryOptions = {
  mode: Entry['mode'],
  module: Entry['module'],
  minify: Entry['minify'],
  platform: Entry['platform'],
  sourcemap: Entry['sourcemap'],
};

export type EntryGroup = Record<
  ReturnType<typeof hashOptions>,
  Entry[]
>;

export function hashOptions(options: EntryOptions): string {
  const normalized: EntryOptions = {
    mode: options.mode,
    module: options.module,
    minify: options.minify,
    platform: options.platform,
    sourcemap: options.sourcemap,
  };
  return JSON.stringify(normalized);
}

export function optionsFromHash(hash: string): EntryOptions {
  return JSON.parse(hash);
}

export function extractEntryOptions(entry: Entry): EntryOptions {
  const options: EntryOptions = {
    mode: entry.mode,
    module: entry.module,
    minify: entry.minify,
    platform: entry.platform,
    sourcemap: entry.sourcemap,
  };
  return options;
}

export function groupEntries(entries: Entry[]): EntryGroup {
  const group: EntryGroup = {};

  for (const entry of entries) {
    const options = extractEntryOptions(entry);
    const optionsHash = hashOptions(options);
    if (group[optionsHash]) {
      group[optionsHash].push(entry);
    } else {
      group[optionsHash] = [entry];
    }
  }

  return group;
}

export function filterBundleEntry(entry: Entry): boolean {
  return entry.module === 'esmodule' || entry.module === 'commonjs';
}

export function filterTypeEntry(entry: Entry): boolean {
  return entry.module === 'dts';
}

export function filterFileEntry(entry: Entry): boolean {
  return entry.module === 'file';
}