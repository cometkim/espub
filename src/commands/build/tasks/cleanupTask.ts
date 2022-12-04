import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import * as formatUtils from '../../../formatUtils';
import { NanobundleError } from '../../../errors';
import { type Context } from '../../../context';
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
  outputFiles: OutputFile[],
};

type CleanupTaskResult = {
};

export async function cleanupTask({
  context,
  outputFiles,
}: CleanupTaskOptions): Promise<CleanupTaskResult> {
  const resolvedOutDir = context.resolve(context.cwd, context.outDir);
  const relativeOutDir = path.relative(context.cwd, resolvedOutDir);

  if (relativeOutDir !== context.cwd && !relativeOutDir.startsWith('..')) {
    context.reporter.info(`Cleanup ${formatUtils.path(relativeOutDir)}`);
    await fs.rm(resolvedOutDir, { recursive: true, force: true });
    return {};
  }

  const subtasks: Array<Promise<void>> = [];
  for (const file of outputFiles) {
    if (file.path === file.sourcePath) {
      context.reporter.debug(`src=dest for ${file.path}, seem to a bug`);
      continue;
    }
    context.reporter.info(`Cleanup ${formatUtils.path(file.path)}`);
    subtasks.push(fs.rm(file.path, { force: true }));
  }

  const results = await Promise.allSettled(subtasks);
  const rejects = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (rejects.length) {
    throw new CleanupTaskError(rejects.map(reject => reject.reason));
  }

  return {};
}
