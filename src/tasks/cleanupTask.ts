import * as fs from 'node:fs/promises';

import * as formatUtils from '../formatUtils';
import { NanobundleError } from '../errors';
import { type Context } from '../context';
import { type OutputFile } from '../outputFile';

export class CleanupTaskError extends NanobundleError {
  reasons: any[];
  constructor(reasons: any[]) {
    super();
    this.reasons = reasons;
  }
}

type CleanupTaskOptions = {
  context: Context,
  outputFiles: Array<Pick<OutputFile, 'path' | 'sourcePath'>>,
};

type CleanupTaskResult = {
};

export async function cleanupTask({
  context,
  outputFiles,
}: CleanupTaskOptions): Promise<CleanupTaskResult> {
  const resolvedOutDir = context.resolvePath(context.outDir);
  const relativeOutDir = context.resolveRelativePath(resolvedOutDir);

  if (relativeOutDir !== '' && !relativeOutDir.startsWith('..')) {
    context.reporter.info(`🗑️  ${formatUtils.path('./' + relativeOutDir)}`);
    await fs.rm(resolvedOutDir, { recursive: true, force: true });
    return {};
  }

  const subtasks: Array<Promise<void>> = [];
  for (const file of outputFiles) {
    if (file.path === file.sourcePath) {
      context.reporter.debug(`src=dest for ${file.path}, skipping`);
      continue;
    }
    context.reporter.info(`🗑️  ${formatUtils.path('./' + context.resolveRelativePath(file.path))}`);
    subtasks.push(fs.rm(file.path, { force: true }));
  }

  const results = await Promise.allSettled(subtasks);
  const rejects = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (rejects.length) {
    throw new CleanupTaskError(rejects.map(reject => reject.reason));
  }

  return {};
}
