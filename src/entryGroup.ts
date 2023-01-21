import { type OverrideProps } from '@cometjs/core';

import { type Entry } from './entry';

export type BundleEntry = OverrideProps<Entry, {
  module: 'esmodule' | 'commonjs',
}>;
export function filterBundleEntry(entry: Entry): entry is BundleEntry {
  return entry.module === 'esmodule' || entry.module === 'commonjs';
}

export type TypeEntry = OverrideProps<Entry, {
  module: 'dts',
}>;
export function filterTypeEntry(entry: Entry): entry is TypeEntry {
  return entry.module === 'dts';
}

export type FileEntry = OverrideProps<Entry, {
  module: 'file',
}>;
export function filterFileEntry(entry: Entry): entry is FileEntry {
  return entry.module === 'file';
}

export type BundleOptions = {
  mode: BundleEntry['mode'],
  module: BundleEntry['module'],
  minify: BundleEntry['minify'],
  platform: BundleEntry['platform'],
  sourcemap: BundleEntry['sourcemap'],
  customConditions: BundleEntry['customConditions'],
};

export type BundleEntryGroup = Record<
  ReturnType<typeof hashBundleOptions>,
  BundleEntry[]
>;

export function hashBundleOptions(options: BundleOptions): string {
  const normalized: BundleOptions = {
    mode: options.mode,
    module: options.module,
    minify: options.minify,
    platform: options.platform,
    sourcemap: options.sourcemap,
    customConditions: [...options.customConditions].sort(),
  };
  return JSON.stringify(normalized);
}

export function optionsFromHash(hash: string): BundleOptions {
  return JSON.parse(hash);
}

export function extractBundleOptions(entry: BundleEntry): BundleOptions {
  const options: BundleOptions = {
    mode: entry.mode,
    module: entry.module,
    minify: entry.minify,
    platform: entry.platform,
    sourcemap: entry.sourcemap,
    customConditions: entry.customConditions,
  };
  return options;
}

export function groupBundleEntries(entries: BundleEntry[]): BundleEntryGroup {
  const group: BundleEntryGroup = {};

  for (const entry of entries) {
    const options = extractBundleOptions(entry);
    const optionsHash = hashBundleOptions(options);
    if (group[optionsHash]) {
      group[optionsHash].push(entry);
    } else {
      group[optionsHash] = [entry];
    }
  }

  return group;
}
