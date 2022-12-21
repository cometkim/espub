import { type Context } from '../../context';
import { type Entry } from '../../entry';
import { cleanupTask } from '../../tasks/cleanupTask';

type CleanCommandOptions = {
  context: Context,
  entries: Entry[],
};

export async function cleanCommand({
  context,
  entries,
}: CleanCommandOptions): Promise<void> {
  const outputFiles = entries.map(entry => ({
    sourcePath: entry.sourceFile[0],
    path: entry.outputFile,
  }));
  await cleanupTask({ context, outputFiles });
}