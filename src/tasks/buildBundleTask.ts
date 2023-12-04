import * as esbuild from 'esbuild';
import dedent from 'string-dedent';

import { type Context } from '../context';
import { NanobundleError } from '../errors';
import * as fsUtils from '../fsUtils';
import * as formatUtils from '../formatUtils';
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
import { makePlugin as makeDefaultPlugin } from '../plugins/esbuildNanobundlePlugin';

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
};

type BuildBundleTaskResult = {
  outputFiles: OutputFile[],
};

export async function buildBundleTask({
  context,
  bundleEntries,
}: BuildBundleTaskOptions): Promise<BuildBundleTaskResult> {
  if (!context.bundle) {
    context.reporter.debug('buildBundleTask skipped since bundle=false');
    return { outputFiles: [] };
  }

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
    context.reporter.debug('bundle options %o', options);

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
    throw new BuildBundleTaskError('Some errors occur while running esbuild', errors);
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
  const entryPoints: Array<{ in: string, out: string }> = [];
  for (const entry of bundleEntries) {
    const sourceFile = await fsUtils.chooseExist(entry.sourceFile);
    if (!sourceFile) {
      // FIXME
      throw new BuildBundleTaskError(dedent`
        Source file does not exist.

          Expected one of
            - ${entry.sourceFile.join('\n    - ')}

          But no matched files found.

        Please check your ${formatUtils.key('rootDir')} or ${formatUtils.key('outDir')} and try again.
        You can configure it in your ${formatUtils.path('tsconfig.json')}, or in CLI by ${formatUtils.command('--root-dir')} and ${formatUtils.command('--out-dir')} argument.

      `, []);
    }
    entryPoints.push({
      in: sourceFile,
      out: entry.outputFile,
    });
  }

  context.reporter.debug('esbuild entryPoints: %o', entryPoints);

  let esbuildOptions: esbuild.BuildOptions = {
    bundle: true,
    target: context.targets,
    sourcemap: options.sourcemap,
    legalComments: context.legalComments ? 'linked' : 'none',
    minify: options.minify,
    define: {
      'process.env.NANOBUNDLE_PACKAGE_NAME': JSON.stringify(context.manifest.name || 'unknown'),
      'process.env.NANOBUNDLE_PACKAGE_VERSION': JSON.stringify(context.manifest.version || '0.0.0'),
    },
  };

  if (options.module === 'commonjs' || options.module === 'esmodule') {
    esbuildOptions = {
      ...esbuildOptions,
      tsconfig: context.tsconfigPath,
      jsx: context.jsx,
      jsxDev: context.jsxDev,
      jsxFactory: context.jsxFactory,
      jsxFragment: context.jsxFragment,
      jsxImportSource: context.jsxImportSource,
      treeShaking: true,
      keepNames: true,
      format: options.module === 'commonjs' ? 'cjs' : 'esm',
      conditions: options.customConditions,
    };

    if (options.platform === 'deno') {
      esbuildOptions.target = ['deno1.9'];
      esbuildOptions.platform = 'neutral';
    } else {
      esbuildOptions.platform = options.platform;
    }

    if (options.mode) {
      esbuildOptions.define = {
        ...esbuildOptions.define,
        'process.env.NODE_ENV': JSON.stringify(options.mode),
        'process.env.NANOBUNDLE_MODE': JSON.stringify(options.mode),
      };
    }

    const importMaps = normalizeImportMaps(validImportMaps, options);

    const defaultPlugin = makeDefaultPlugin({ context, importMaps });
    esbuildOptions.plugins = [defaultPlugin, ...plugins];
  }

  context.reporter.debug('esbuild build options %o', esbuildOptions);

  const results = await Promise.all(
    entryPoints.map(entry => esbuild.build({
      ...esbuildOptions,
      entryPoints: [entry.in],
      outfile: entry.out,
      write: false,
    }))
  );

  const outputFiles = results.flatMap(result => 
    result.outputFiles
      .filter(outputFile => {
        if (outputFile.path.endsWith('.LEGAL.txt') && outputFile.contents.length === 0) {
          return false;
        }
        return true;
      })
      .map(outputFile => ({
        ...outputFile,
        path: outputFile.path,
      })),
  );

  const errors = results.flatMap(result => result.errors);
  const warnings = results.flatMap(result => result.warnings);

  return {
    errors,
    warnings,
    outputFiles,
  };
}
