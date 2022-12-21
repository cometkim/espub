import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { NanobundleError } from '../errors';
import { type Context } from '../context';
import { type OutputFile } from '../outputFile';

export class EmitTaskError extends NanobundleError {
  reasons: any[];
  constructor(reasons: any[]) {
    super();
    this.reasons = reasons;
  }
}

type EmitTaskOptions = {
  context: Context,
  outputFiles: OutputFile[],
};

type EmitTaskResult = {
  outputFiles: OutputFile[],
};

export async function emitTask({
  outputFiles,
}: EmitTaskOptions): Promise<EmitTaskResult> {
  const subtasks: Array<Promise<void>> = [];

  for (const outputFile of outputFiles) {
    subtasks.push(
      fs.mkdir(path.dirname(outputFile.path), { recursive: true })
        .then(() => fs.writeFile(outputFile.path, outputFile.content)),
    );
  }

  const results = await Promise.allSettled(subtasks);
  const rejects = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  if (rejects.length) {
    throw new EmitTaskError(rejects.map(reject => reject.reason));
  }

  return { outputFiles };
}
