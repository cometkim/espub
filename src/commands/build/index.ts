import dedent from 'string-dedent';
import { performance } from 'node:perf_hooks';
import { interpret } from 'xstate';

import { type Context } from '../../context';
import * as formatUtils from '../../formatUtils';
import { type Entry } from '../../entry';
import { NanobundleError } from '../../errors';

import { buildMachine } from './build.machine';

type BuildCommandOptions = {
  context: Context,
  entries: Entry[],
  cleanFirst?: boolean,
};

export async function buildCommand({
  context,
  entries,
  cleanFirst = false,
}: BuildCommandOptions): Promise<void> {
  context.reporter.info(dedent`
    Build ${formatUtils.highlight(context.manifest.name || 'unnamed')} package

  `);

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

  if (cleanFirst) {
    service.send('CLEAN');
    service.onTransition(state => {
      if (state.can('BUILD')) {
        service.send('BUILD');
      }
    });
  } else {
    service.send('BUILD');
  }

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
