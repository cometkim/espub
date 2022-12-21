import dedent from 'string-dedent';

import { type Context } from '../../context';
import * as formatUtils from '../../formatUtils';
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
  context.reporter.info(dedent`
    Clean ${formatUtils.highlight(context.manifest.name || 'unnamed')} package

  `);

  const outputFiles = entries.map(entry => ({
    sourcePath: entry.sourceFile[0],
    path: entry.outputFile,
  }));
  await cleanupTask({ context, outputFiles });
}