import * as esbuild from 'esbuild';

import {
  type Context,
} from '../../../context';
import * as fsUtils from '../../../fsUtils';
import {
  groupBundleEntries,
  optionsFromHash,
  type BundleEntry,
  type BundleOptions,
} from '../entryGroup';
import {
  loadImportMaps,
  normalizeImportMaps,
  validateImportMaps,
  type ValidNodeImportMaps,
} from '../importMaps';
import {
  type OutputFile,
} from '../outputFile';
import {
  makePlugin as makeImportMapsPlugin,
} from '../plugins/esbuildImportMapsPlugin';
import {
  makePlugin as makeEmbedPlugin,
} from '../plugins/esbuildEmbedPlugin';

export class NanobundleBuildBundleError extends Error {
  name = 'NanobundleBuildBundleError';

  esbuildErrors: esbuild.Message[];

  constructor(errors: esbuild.Message[]) {
    super();
    this.esbuildErrors = errors;
  }
}

type BuildBundleTaskOptions = {
  context: Context,
  bundleEntries: BundleEntry[],
}

type BuildBundleTaskResult = {
  outputFiles: OutputFile[],
};

export async function buildBundleTask({
  context,
  bundleEntries,
}: BuildBundleTaskOptions): Promise<BuildBundleTaskResult> {
  const importMaps = await loadImportMaps(context);
  const validImportMaps = await validateImportMaps({ context, importMaps });
  const bundleGroup = groupBundleEntries(bundleEntries);
  const subtasks: Array<Promise<BuildBundleGroupResult>> = [];
  for (const [optionsHash, entries] of Object.entries(bundleGroup)) {
    const options = optionsFromHash(optionsHash);
    subtasks.push(
      buildBundleGroup({
        context,
        options,
        bundleEntries: entries,
        validImportMaps,
        defaultPlugins: [],
      }),
    );
  }
  const results = await Promise.all(subtasks);
  const errors = results.flatMap(result => result.errors);
  if (errors.length > 0) {
    throw new NanobundleBuildBundleError(errors);
  }

  const outputFiles = results
    .flatMap(result => result.outputFiles)
    .map(outputFile => ({
      path: outputFile.path,
      content: outputFile.contents,
    }));

  return { outputFiles };
}

type BuildBundleGroupOptions = {
  context: Context,
  defaultPlugins: esbuild.Plugin[],
  validImportMaps: ValidNodeImportMaps,
  bundleEntries: BundleEntry[],
  options: BundleOptions,
};

type BuildBundleGroupResult = {
  errors: esbuild.Message[],
  outputFiles: esbuild.OutputFile[],
};

async function buildBundleGroup({
  context,
  defaultPlugins,
  validImportMaps,
  bundleEntries,
  options,
}: BuildBundleGroupOptions): Promise<BuildBundleGroupResult> {
  const entryPointsEntries: [string, string][] = [];
  for (const entry of bundleEntries) {
    let sourceFile: string | null = null;
    for (const candidate of entry.sourceFile) {
      const path = context.resolve(context.cwd, candidate);
      const exist = await fsUtils.exists(path);
      if (exist) {
        sourceFile = candidate;
      }
    }
    if (!sourceFile) {
      // FIXME
      throw new Error('buildBundle');
    }
    entryPointsEntries.push([entry.outputFile, sourceFile]);
  }

  const esbuildOptions: esbuild.BuildOptions = {
    entryPoints: Object.fromEntries(entryPointsEntries),
    bundle: true,
    treeShaking: true,
    target: context.targets,
    format: options.module === 'commonjs' ? 'cjs' : 'esm',
    sourcemap: options.sourcemap,
    minify: options.minify,
    plugins: [],
  };
  if (options.platform === 'deno') {
    esbuildOptions.platform = 'neutral';
  } else {
    esbuildOptions.platform = options.platform;
  }
  if (options.mode) {
    esbuildOptions.define = {
      'process.env.NODE_ENV': JSON.stringify(options.mode),
    };
  }

  const importMapsCondition = options.platform === 'node' ? 'node' : 'default';
  const importMaps = normalizeImportMaps(validImportMaps, importMapsCondition);
  const importMapsPlugin = makeImportMapsPlugin({ context, importMaps, platform: importMapsCondition });
  esbuildOptions.plugins?.push(importMapsPlugin);

  const embedPlugin = makeEmbedPlugin({ context });
  esbuildOptions.plugins?.push(embedPlugin);

  esbuildOptions.plugins = [
    ...esbuildOptions.plugins ?? [],
    ...defaultPlugins,
  ];

  const result = await esbuild.build({
    ...esbuildOptions,
    write: false,
  });

  return {
    errors: result.errors,
    outputFiles: result.outputFiles,
  };
}