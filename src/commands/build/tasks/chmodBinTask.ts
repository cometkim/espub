import * as fs from 'node:fs/promises';

import { type Context } from '../../../context';
import { type BundleEntry } from '../entryGroup';

type ChmodBinTaskOptions = {
  context: Context,
  binEntries: BundleEntry[],
};

type ChmodBinTaskResult = {
};

export async function chmodBinTask({
  context,
  binEntries,
}: ChmodBinTaskOptions): Promise<ChmodBinTaskResult> {
  const subtasks: Array<Promise<void>> = [];
  for (const entry of binEntries) {
    subtasks.push(
      fs.chmod(entry.outputFile, '+x'),
    );
  }
  await Promise.all(subtasks);

  return {};
}
