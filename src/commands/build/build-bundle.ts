import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as esbuild from 'esbuild';
import {
  type BuildOptions as EsbuildOptions,
  type Message as EsbuildMessage,
  type OutputFile as EsbuildOutputFile,
  type Plugin as EsbuildPlugin,
} from 'esbuild';

import {
  type Context,
} from '../../context';
import * as fsUtils from '../../fsUtils';

import {
  groupBundleEntries,
  optionsFromHash,
  type BundleEntry,
  type BundleOptions,
} from './entryGroup';
import { loadImportMaps, normalizeImportMaps, validateImportMaps, ValidNodeImportMaps } from './importMaps';

class EsbuildTaskError extends Error {
  name = 'EsbuildTaskError';
  esbuildErrors: EsbuildMessage[],
  constructor(errors: EsbuildMessage[]) {
    super();
    this.esbuildErrors = errors;
  }
}

class EmitTaskError extends Error {
  name = 'EmitTaskError';
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
  const validatedImportMaps = await validateImportMaps({ context, importMaps });

  const bundleGroup = groupBundleEntries(bundleEntries);

  const buildTasks: Array<ReturnType<typeof buildTask>> = [];
  for (const [optionsHash, entries] of Object.entries(bundleGroup)) {
    const options = optionsFromHash(optionsHash);
    buildTasks.push(buildTask({ context, options, entries }));
  }
  try {
    const buildResults = await Promise.all(buildTasks);
    const buildErrors = buildResults.flatMap(buildResult => buildResult.errors);
    if (buildErrors.length > 0) {
      throw new EsbuildTaskError(buildErrors);
    }

    const emitResults = (
      await Promise.all(
        buildResults
          .map(({ outputFiles }) => emitTask({ outputFiles }))
      )
    ).flat();

    // TODO: report success

    // TODO: report errors

  } catch (error) {
    // TODO: report errors

    // TODO: cleanup outdir
  }
}

type BuildBundleGroupOptions = {
  context: Context,
  defaultPlugins: EsbuildPlugin[],
  validImportMaps: ValidNodeImportMaps,
  entries: BundleEntry[],
  options: BundleOptions,
};

type BuildBundleGroupResult = {
  errors: EsbuildMessage[],
  outputFiles: EsbuildOutputFile[],
};

async function buildTask({
  context,
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
  const entryPoints = Object.fromEntries(entryPointsEntries);

  const esbuildOptions: EsbuildOptions = {
    entryPoints,
    bundle: true,
    treeShaking: true,
    target: context.targets,
    format: options.module === 'commonjs' ? 'cjs' : 'esm',
    sourcemap: options.sourcemap,
    minify: options.minify,
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

  const
  if (options.platform === 'node') {
    const importMaps = normalizeImportMaps(validImportMaps, 'node');
    esbuildOptions.plugins
  }

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
  outputFiles: EsbuildOutputFile[],
};

type EmitTaskResult = {

};

function emitTask({
  outputFiles,
}: EmitTaskOptions) {
  type EmitSubtask = {
    outputFile: EsbuildOutputFile,
  };
  async function subtask(outputFile: EsbuildOutputFile): Promise<EmitSubtask> {
    const dirname = path.dirname(outputFile.path);
    await fs.mkdir(dirname, { recursive: true });
    await fs.writeFile(outputFile.path, outputFile.contents);
    return { outputFile };
  };

  const tasks: Array<Promise<EmitSubtask>> = [];
  for (const outputFile of outputFiles) {
    tasks.push(subtask(outputFile));
  }

  return Promise.allSettled(tasks);
}