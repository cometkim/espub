import * as fs from 'node:fs/promises';
import dedent from 'string-dedent';

import * as formatUtils from '../../../formatUtils';
import { type Context } from '../../../context';
import { type FileEntry } from '../entryGroup';
import { type OutputFile } from '../outputFile';
import { NanobundleError } from '../../../errors';

export class BuildFileTaskError extends NanobundleError {
  reasons: any[];
  constructor(reasons: any[]) {
    super();
    this.reasons = reasons;
  }
}

type BuildFileTaskOptions = {
  context: Context,
  fileEntries: FileEntry[],
};

type BuildFileTaskResult = {
  outputFiles: OutputFile[],
};

export async function buildFileTask({
  context,
  fileEntries,
}: BuildFileTaskOptions): Promise<BuildFileTaskResult> {
  if (fileEntries.length > 0) {
    context.reporter.debug(`start buildFileTask for ${fileEntries.length} entries`);
  } else {
    context.reporter.debug('there are no file entries, skipped buildFileTask');
    return { outputFiles: [] };
  }

  const subtasks: Array<Promise<BuildFileResult>> = [];
  for (const entry of fileEntries) {
    const sourceFile = entry.sourceFile[0];
    const outputFile = entry.outputFile;
    if (sourceFile === outputFile) {
      context.reporter.debug(dedent`
        noop for ${formatUtils.key(entry.key)} because of source path and output path are the same.
          entry path: ${formatUtils.path(entry.entryPath)}
      `);
      continue;
    }
    subtasks.push(buildFile({ sourceFile, outputFile }));
  }

  const results = await Promise.allSettled(subtasks);
  const rejects = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (rejects.length) {
    throw new BuildFileTaskError(rejects.map(reject => reject.reason));
  }
  const resolves = results as PromiseFulfilledResult<BuildFileResult>[];
  const outputFiles = resolves.map(result => result.value.outputFile);

  return { outputFiles };
}

type BuildFileOptions = {
  sourceFile: string,
  outputFile: string,
};

type BuildFileResult = {
  outputFile: OutputFile,
}

async function buildFile({
  sourceFile,
  outputFile,
}: BuildFileOptions): Promise<BuildFileResult> {
  const content = await fs.readFile(sourceFile);
  return {
    outputFile: {
      sourcePath: sourceFile,
      path: outputFile,
      content,
    },
  };
}