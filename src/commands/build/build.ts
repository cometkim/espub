import { performance } from 'node:perf_hooks';
import { interpret } from 'xstate';

import * as formatUtils from '../../formatUtils';
import { type Context } from '../../context';
import { type Entry } from '../../entry';

import { buildMachine } from './build.machine';

type BuildCommandOptions = {
  context: Context,
  entries: Entry[],
};

export async function buildCommand({
  context,
  entries,
}: BuildCommandOptions): Promise<void> {
  const service = interpret(
    buildMachine
      .withContext({
        root: context,
        entries,
        outputFiles: [],
        errors: {},
        buildStartedAt: performance.now(),
      }),
  );
  service.start();

  context.reporter.info(
    `build ${formatUtils.highlight(context.manifest.name || 'unnamed')} package`,
  );
  service.send('BUILD');

  return new Promise(resolve => {
    service.onDone(() => resolve());
  });
}
