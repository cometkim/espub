import { performance } from 'node:perf_hooks';
import { interpret } from 'xstate';

import { type Context } from '../../context';
import { type Entry } from '../../entry';
import { NanobundleError } from '../../errors';

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
        bundleOutputs: [],
        fileOutputs: [],
        typeOutputs: [],
        errors: {},
        buildStartedAt: performance.now(),
      }),
  );
  service.start();
  service.send('BUILD');
  return new Promise((resolve, reject) => {
    service.onDone(() => {
      const state = service.getSnapshot();
      const hasBuildErrors = Object.values(state.context.errors).some(Boolean);
      if (hasBuildErrors) {
        reject(new NanobundleError());
      } else {
        resolve();
      }
    });
  });
}
