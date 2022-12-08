import * as path from 'node:path';
import * as esbuild from 'esbuild';
import dedent from 'string-dedent';

import { type Context } from '../../../context';
import { NanobundleError } from '../../../errors';
import * as fsUtils from '../../../fsUtils';
import * as formatUtils from '../../../formatUtils';
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
import { type OutputFile } from '../outputFile';
import { makePlugin as makeImportMapsPlugin } from '../plugins/esbuildImportMapsPlugin';
import { makePlugin as makeEmbedPlugin } from '../plugins/esbuildEmbedPlugin';

export class BuildBundleTaskError extends NanobundleError {
  esbuildErrors: esbuild.Message[];
  constructor(message: string, errors: esbuild.Message[]) {
    super(message);
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
  if (bundleEntries.length > 0) {
    context.reporter.debug(`start buildBundleTask for ${bundleEntries.length} entries`);
  } else {
    context.reporter.debug('there are no js entries, skipped buildBundleTask');
    return { outputFiles: [] };
  }

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
        plugins: [],
      }),
    );
  }
  const results = await Promise.all(subtasks);

  const errors = results.flatMap(result => result.errors);
  if (errors.length > 0) {
    throw new BuildBundleTaskError('Some errors occur while runnign esbuild', errors);
  }

  const warnings = results.flatMap(result => result.warnings);
  if (warnings.length > 0) {
    for (const warning of warnings) {
      context.reporter.warn(warning.text);
    }
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
  plugins: esbuild.Plugin[],
  validImportMaps: ValidNodeImportMaps,
  bundleEntries: BundleEntry[],
  options: BundleOptions,
};

type BuildBundleGroupResult = {
  errors: esbuild.Message[],
  warnings: esbuild.Message[],
  outputFiles: esbuild.OutputFile[],
};

async function buildBundleGroup({
  context,
  plugins,
  validImportMaps,
  bundleEntries,
  options,
}: BuildBundleGroupOptions): Promise<BuildBundleGroupResult> {
  const baseDir = path.resolve(context.cwd);
  const entryPointsEntries: [string, string][] = [];
  for (const entry of bundleEntries) {
    const sourceFile = await fsUtils.chooseExist(entry.sourceFile);
    if (!sourceFile) {
      // FIXME
      throw new BuildBundleTaskError(dedent`
        Source file doesn not exist.

          Expected one of
            - ${entry.sourceFile.join('\n    - ')}

          But no matched files found.

        Please check your ${formatUtils.key('rootDir')} or ${formatUtils.key('outDir')} and try again.
        You can configure it in your ${formatUtils.path('tsconfig.json')}, or in CLI by ${formatUtils.command('--root-dir')} and ${formatUtils.command('--out-dir')} argument.

      `, []);
    }
    entryPointsEntries.push([
      path.relative(baseDir, entry.outputFile),
      sourceFile,
    ]);
  }

  const entryPoints = Object.fromEntries(entryPointsEntries);
  context.reporter.debug('esbuild entryPoints: %o', entryPoints);

  const esbuildOptions: esbuild.BuildOptions = {
    entryPoints,
    outdir: baseDir,
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

  const importMaps = normalizeImportMaps(validImportMaps, options);
  const importMapsPlugin = makeImportMapsPlugin({ context, importMaps });
  esbuildOptions.plugins?.push(importMapsPlugin);

  const embedPlugin = makeEmbedPlugin({ context });
  esbuildOptions.plugins?.push(embedPlugin);

  esbuildOptions.plugins = [
    ...esbuildOptions.plugins ?? [],
    ...plugins,
  ];

  const result = await esbuild.build({
    ...esbuildOptions,
    write: false,
  });

  const outputFiles = result.outputFiles.map(outputFile => ({
    ...outputFile,
    path: outputFile.path
      .replace(/\.js$/, '')
      .replace(/\.js\.map$/, '.map'),
  }));

  return {
    errors: result.errors,
    warnings: result.warnings,
    outputFiles,
  };
}
