import { test, expect } from "vitest";

import type { BundleEntry, BundleEntryGroup } from './entryGroup';
import { groupBundleEntries, hashBundleOptions } from './entryGroup';

test('groupEntries should split different option set', () => {
  const entries: BundleEntry[] = [
    {
      key: 'exports["."].node.require',
      module: "commonjs",
      mode: undefined,
      minify: false,
      sourcemap: true,
      platform: "node",
      entryPath: "./lib/index.cjs",
      sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
      outputFile: "/project/lib/index.cjs",
    },
    {
      key: 'exports["."].node.import.development',
      module: "esmodule",
      mode: "development",
      minify: false,
      sourcemap: true,
      platform: "node",
      entryPath: "./lib/index.mjs",
      sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
      outputFile: "/project/lib/index.mjs",
    },
    {
      key: 'exports["."].node.import.production',
      module: "esmodule",
      mode: "production",
      minify: true,
      sourcemap: true,
      platform: "node",
      entryPath: "./lib/index.min.mjs",
      sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
      outputFile: "/project/lib/index.min.mjs",
    },
    {
      key: 'exports["."].browser.development',
      module: "commonjs",
      mode: "development",
      minify: false,
      sourcemap: true,
      platform: "browser",
      entryPath: "./lib/browser.js",
      sourceFile: ["/project/src/browser.cjs", "/project/src/browser.js"],
      outputFile: "/project/lib/browser.js",
    },
    {
      key: 'exports["."].browser.production',
      module: "commonjs",
      mode: "production",
      minify: true,
      sourcemap: true,
      platform: "browser",
      entryPath: "./lib/browser.min.js",
      sourceFile: ["/project/src/browser.cjs", "/project/src/browser.js"],
      outputFile: "/project/lib/browser.min.js",
    },
  ];

  expect(groupBundleEntries(entries)).toEqual<BundleEntryGroup>({
    [hashBundleOptions({ mode: undefined, module: 'commonjs', platform: 'node', sourcemap: true, minify: false })]: [
      {
        key: 'exports["."].node.require',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "node",
        entryPath: "./lib/index.cjs",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.cjs",
      },
    ],
    [hashBundleOptions({ mode: 'development', module: 'esmodule', platform: 'node', sourcemap: true, minify: false })]: [
      {
        key: 'exports["."].node.import.development',
        module: "esmodule",
        mode: "development",
        minify: false,
        sourcemap: true,
        platform: "node",
        entryPath: "./lib/index.mjs",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.mjs",
      },
    ],
    [hashBundleOptions({ mode: 'production', module: 'esmodule', platform: 'node', sourcemap: true, minify: true })]: [
      {
        key: 'exports["."].node.import.production',
        module: "esmodule",
        mode: "production",
        minify: true,
        sourcemap: true,
        platform: "node",
        entryPath: "./lib/index.min.mjs",
        sourceFile: ["/project/src/index.mjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.min.mjs",
      },
    ],
    [hashBundleOptions({ mode: 'development', module: 'commonjs', platform: 'browser', sourcemap: true, minify: false })]: [
      {
        key: 'exports["."].browser.development',
        module: "commonjs",
        mode: "development",
        minify: false,
        sourcemap: true,
        platform: "browser",
        entryPath: "./lib/browser.js",
        sourceFile: ["/project/src/browser.cjs", "/project/src/browser.js"],
        outputFile: "/project/lib/browser.js",
      },
    ],
    [hashBundleOptions({ mode: 'production', module: 'commonjs', platform: 'browser', sourcemap: true, minify: true })]: [
      {
        key: 'exports["."].browser.production',
        module: "commonjs",
        mode: "production",
        minify: true,
        sourcemap: true,
        platform: "browser",
        entryPath: "./lib/browser.min.js",
        sourceFile: ["/project/src/browser.cjs", "/project/src/browser.js"],
        outputFile: "/project/lib/browser.min.js",
      },
    ],
  })
});

test('groupEntries should merge same option set', () => {
  const entries: BundleEntry[] = [
    {
      key: 'exports["."].require',
      module: "commonjs",
      mode: undefined,
      minify: false,
      sourcemap: true,
      platform: "neutral",
      entryPath: "./lib/index.cjs",
      sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
      outputFile: "/project/lib/index.cjs",
    },
    {
      key: 'exports["."].default.require',
      module: "commonjs",
      mode: undefined,
      minify: false,
      sourcemap: true,
      platform: "neutral",
      entryPath: "./lib/index.cjs",
      sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
      outputFile: "/project/lib/index.cjs",
    },
    {
      key: 'exports["."].default.default.require',
      module: "commonjs",
      mode: undefined,
      minify: false,
      sourcemap: true,
      platform: "neutral",
      entryPath: "./lib/index.cjs",
      sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
      outputFile: "/project/lib/index.cjs",
    },
  ];

  expect(groupBundleEntries(entries)).toEqual<BundleEntryGroup>({
    [hashBundleOptions({ mode: undefined, module: 'commonjs', platform: 'neutral', sourcemap: true, minify: false })]: [
      {
        key: 'exports["."].require',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.cjs",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.cjs",
      },
      {
        key: 'exports["."].default.require',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.cjs",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.cjs",
      },
      {
        key: 'exports["."].default.default.require',
        module: "commonjs",
        mode: undefined,
        minify: false,
        sourcemap: true,
        platform: "neutral",
        entryPath: "./lib/index.cjs",
        sourceFile: ["/project/src/index.cjs", "/project/src/index.js"],
        outputFile: "/project/lib/index.cjs",
      },
    ],
  });
});