import { readFile } from 'node:fs/promises';
import dedent from 'string-dedent';

import * as formatUtils from '../../../formatUtils';
import {
  type Context,
} from '../../../context';
import {
  type FileEntry,
} from '../entryGroup';
import {
  type OutputFile,
} from '../outputFile';

type BuildFileTaskOptions = {
  context: Context,
  fileEntries: FileEntry[],
};

type BuildFileTaskResult = {
  outputFiles: OutputFile[],
}

export async function buildFileTask({
  context,
  fileEntries,
}: BuildFileTaskOptions): Promise<BuildFileTaskResult> {
  const subtasks: Array<Promise<BuildFileResult>> = [];
  for (const entry of fileEntries) {
    const sourceFile = entry.sourceFile[0];
    const outputFile = entry.outputFile;

    if (sourceFile === outputFile) {
      context.reporter.debug(dedent`
        Noop for ${formatUtils.key(entry.key)} because of source path and output path are the same.
      `);
      continue;
    }

    subtasks.push(buildFile({ sourceFile, outputFile }));
  }

  const jobs = await Promise.all(subtasks);
  const outputFiles = jobs.map(job => job.outputFile);

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
  const content = await readFile(sourceFile);
  return {
    outputFile: {
      path: outputFile,
      content,
    },
  };
}