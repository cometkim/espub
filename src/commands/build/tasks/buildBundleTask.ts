import * as fs from 'node:fs/promises';
import * as path from 'node:path';
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
import { makePlugin as makeImportMapsPlugin } from '../plugins/esbuildImportMapsPlugin';
import { makePlugin as makeEmbedPlugin } from '../plugins/esbuildEmbedPlugin';

class EsbuildTaskError extends Error {
  name = 'EsbuildTaskError';
  esbuildErrors: esbuild.Message[],
  constructor(errors: esbuild.Message[]) {
    super();
    this.esbuildErrors = errors;
  }
}

type BuildBundleOptions = {
  context: Context,
  bundleEntries: BundleEntry[],
}

type BuildBundleResult = {

};

export async function buildBundle({
  context,
  bundleEntries,
}: BuildBundleOptions): Promise<BuildBundleResult> {
  const importMaps = await loadImportMaps(context);
  const validImportMaps = await validateImportMaps({ context, importMaps });

  const bundleGroup = groupBundleEntries(bundleEntries);

  const buildTasks: Array<ReturnType<typeof buildTask>> = [];
  for (const [optionsHash, entries] of Object.entries(bundleGroup)) {
    const options = optionsFromHash(optionsHash);
    buildTasks.push(
      buildTask({
        context,
        options,
        entries,
        validImportMaps,
        defaultPlugins: [],
      }),
    );
  }
  try {
    const buildResults = await Promise.all(buildTasks);
    const buildErrors = buildResults.flatMap(buildResult => buildResult.errors);
    if (buildErrors.length > 0) {
      throw new EsbuildTaskError(buildErrors);
    }
    const emitResults = await Promise.all(buildResults.map(emitTask));

    // TODO: report success

    // TODO: report errors

  } catch (error) {
    // TODO: report errors

    // TODO: cleanup outdir
  }
}

type BuildBundleGroupOptions = {
  context: Context,
  defaultPlugins: esbuild.Plugin[],
  validImportMaps: ValidNodeImportMaps,
  entries: BundleEntry[],
  options: BundleOptions,
};

type BuildBundleGroupResult = {
  errors: esbuild.Message[],
  outputFiles: esbuild.OutputFile[],
};

async function buildTask({
  context,
  defaultPlugins,
  validImportMaps,
  entries,
  options,
}: BuildBundleGroupOptions): Promise<BuildBundleGroupResult> {
  const entryPointsEntries: [string, string][] = [];
  for (const entry of entries) {
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

type EmitTaskOptions = {
  outputFiles: esbuild.OutputFile[],
};

type EmitTaskResult = {
  errors: EmitTaskError,
  outputFiles: esbuild.OutputFile[],
};

type EmitTaskError = {
  message: string,
};

async function emitTask({
  outputFiles,
}: EmitTaskOptions): Promise<EmitTaskResult> {
  type EmitSubtask = {
    outputFile: esbuild.OutputFile,
  };
  async function subtask(outputFile: esbuild.OutputFile): Promise<EmitSubtask> {
    const dirname = path.dirname(outputFile.path);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(outputFile.path, outputFile.contents);
    return { outputFile };
  };
  return Promise.allSettled(outputFiles.map(subtask));
}
