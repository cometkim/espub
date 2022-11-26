import { interpret } from 'xstate';

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
        outputFiles: [],
        buildStartedAt: 0,
      })
      .withConfig({
        actions: {

        },
        services: {

        },
        guards: {

        },
      }),
  );

  service.onTransition(state => {
  });

  service.start();

  service.send({
    type: 'BUILD',
    entries,
  });
}
