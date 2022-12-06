import { performance } from 'node:perf_hooks';
import { assign, createMachine } from 'xstate';

import { type Context } from '../../context';
import { type Entry } from '../../entry';
import {
  filterBundleEntry,
  filterFileEntry,
  filterTypeEntry,
} from './entryGroup';
import { type OutputFile } from './outputFile';

import { buildBundleTask, type BuildBundleTaskError } from './tasks/buildBundleTask';
import { buildFileTask, type BuildFileTaskError } from './tasks/buildFileTask';
import { buildTypeTask, type BuildTypeTaskError } from './tasks/buildTypeTask';
import { chmodBinTask } from './tasks/chmodBinTask';
import { cleanupTask, type CleanupTaskError } from './tasks/cleanupTask';
import { emitTask, type EmitTaskError } from './tasks/emitTask';
import { reportEmitResultsTask } from './tasks/reportEmitResultsTask';

export const buildMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QCMCuBLANhAsgQwGMALdAOzADpkB7agF1joCc8AHAYgCEBVASQBkAIgG0ADAF1EoVtVjo66aqSkgAHogCMAVgAsFAJz6AbBtEajAZgDsWizqtGANCACeiLaIsGrGi7YsaAEw2phYAvmHOaFi4hCTkVBjYAKKkzOhw7BBKlIx4dJTR2PjEZIVJEKnpcGKSSCAycgpKKuoIABw6+hQW+qKB+qb2Rjbtzm4IQaJ6OoFaWj7tgRbLdhFRFSXx5TFVTBmwWTkUeQWJMVtl5ylp+zUaddKy8orK9W0rGj2Bs35GZvplmNXJpAtMKLN5jojLN9H4-OsQEVYqUEsi9gdrhBOKhSBBMGAMXAsUcEmQAG7UADWO2KcSu6NumOROLxBKJsCxCAp1AI+VetVqKkaLxa70QRn+FFE7S0g1ENn0CzM400dgogXaFi1OnsWhGlisiORlzRFQ5WNZ+MJTOJyPYYCYTGoTAorEw+QAZi6ALZY020yq2zks3HWi3I7mkSl85qkQUSYXPOOtCVSmVy0yK5UaVUIZZfTrWOaBUtWaFGdrGzb0s27YNYgBiWBt1RDFVJlB5NP9tcDEYqzfZDcjPNjAokQvqIpT4oQlnaFEsOiGvhsnlzIIQOiWGqsYK1Vk8g2C1YufaxA5iQ9bd3bMQdTpdbo9dG9TD9JovjLbTZbV+wKMY35JQE0eBpk1eVN521Jc7FXawPACPMFm6LUNH0csdA8fQtTPOlUX7EcKgAFRcVhb2ZDtsjJaNqUDANL2ImIyIogCICA3kQPjSdE2nSCxVANoFwoLCrEGXoLAsIxSzzdCDAwwZdGMBUrCNSIkRrQimN-ZFWMou0O0dZ1XXdL1fV7bSfzvLF9PYzjx1A3jwJnKC5xEsSJLhaTZK3QFunsXDRBknQAh3fCUW2CgwB9eQOU7ChuwYi8Yri4MHO4sCkyaNyhMQOxFy0DQlhhawgklGw8w0aFAghfpMICdp93E9SNnPbTUroeLjOfMy3wsr8Otirr0rHTLnOy0U3jyhA5SMUTKwsGV-gwxqqr8KxpU1FZdWmdp9B0CLGIIAk8FIVAOBors6J7QaopOsAzoujK4yy-icsEtREHaIwtC29C7GmOF5iqjw-phQwVy0LUtGCIwjovB6no4HrTNfd9Py0+7TvO1gXoncQpyeD7pq+jpfooTofuq-dTCLUGmspjxl0rHxBkOjS7quYgfWobEyHiq7Epu5LtJ5vnOAF0a6McnjCb44mpugmTRGlMxtoOkx9x0Kr93mjQrHhURbFhhcEbFohef50huqfNHzI-Sz7stiWpbbfGnPllyBNJ4SwUpwJzA0IPAhGQJdcN6Vip3IxjGq6Sq05rGriYMAZCYLrhoAJTgVBMAYBKkqdlO05dTP5Bz2A84YD25aJiCSeggBaYIKF8HUd10bUZUqrdzD8HpdAN6GfpMWHzai1P0-LuhK+rw4haLrmEinsvkmz3P89gWvBQeSbZxmrpFxWQPLG0Q8tCqyw-r8FdRlH7QIg00g+bgFRl7AffcrJpubDb7U7Cd1Cu0GUwIJhN18LVGE0NLBzGsFqfQE8GS0AYMwNgX9PptFMBQVCpZcIOFwqbJwW5TZq3lDoaY0JTDwyTu1KK1kDgYN9vlAIBhdqmHjj5bCeYm6hSXLHJaUkiz6hoW1Ai9DzTMWwFaYcbYmHQW7hCDCcxZi-VhNCPM2EegKjmEqY2ocfBILrDcXSFQZEGXvNgeRc5ZiLhXICXQodHGayqjuHB4kKE7i6IHbQ4RaHiIZJI0xMRzEWirgQAgcB4DvSVnOPoqsHADH2qIYKMJpig02gqZSspDA+NsEYoiwTpFhlkTZT0eAsCoFTtYma8SFpJPiZKTxeYVFwVsPtOwMl2jRwKTpGyyIbwchqWTaw3QDoUI4aFLhl8tySQ1EqDwTUpJIQ5mIyKgT6xFIgIMqREBhltFmJtcZZgzBTJCjMiYXR5r6gcLoVSuorA-V6Qwwy15-wNnCZE2A0TFYHzJrKLwRVY7mENEhTcEwwbSkNPYJYYknn+PWcYoMWydm-nKZU6pMS-ltABTg8wgxJSIQ3Hmf4UDlgLgWNhYqgRnlBP6aRciFj9n5RAd4AllhvIyQsHmcstUDpSRMBVaYKxaWbPpSxRl7FmXbk1GykFkkfLcq3J0eagddCyh+nHTUoqTHiuwHZD5qAIlROlbKWqO4Db-G1OuTUcldCiWDqhEwWrE5rMYi8yxEADVooqZgKpn8sXfxxbDCE3SHCeCah4W1fkQ3BBpp4SUi0aUIsYp1IZgbMH5S0UtamQxfrzF+utfUPQAiEphEENcvSrqmrlG3dosoFTYX1GtPuR5arUslMHAIgwNC9KRrjU1MJtE3NEHCaESwlUTF8MW6qcJ2ahwOj8PtLtrbpt+UGrNXhKwyWKlqBUVqrC636EuNSDyzXWBXL01eGd14V03gwaVUkvBUp+ntQ2fQlSg1boYCSxV6q6HUhEIAA */
  createMachine({
    tsTypes: {} as import("./build.machine.typegen").Typegen0,
    schema: {
      events: {} as {
        type: "BUILD";
      },
      context: {} as {
        root: Context;
        buildStartedAt: number;
        entries: Entry[];
        bundleOutputs: OutputFile[];
        fileOutputs: OutputFile[];
        typeOutputs: OutputFile[];
        errors: {
          buildBundle?: BuildBundleTaskError;
          buildFile?: BuildFileTaskError;
          buildType?: BuildTypeTaskError;
          emit?: EmitTaskError;
          cleanup?: CleanupTaskError;
        };
      },
    },
    predictableActionArguments: true,
    id: "buildMachine",
    initial: "bootstrap",
    states: {
      bootstrap: {
        on: {
          BUILD: {
            target: "buildEntries",
            actions: "reportBuildStart",
          },
        },
      },
      buildEntries: {
        type: "parallel",
        states: {
          buildBundleEntries: {
            initial: "build",
            states: {
              build: {
                invoke: {
                  src: "buildBundleTask",
                  onDone: [
                    {
                      target: "success",
                      actions: "assignBundleOutputs",
                    },
                  ],
                  onError: [
                    {
                      target: "failure",
                      actions: "assignBuildBundleError",
                    },
                  ],
                },
              },
              success: {
                type: "final",
              },
              failure: {
                type: "final",
              },
            },
          },
          buildFileEntries: {
            initial: "build",
            states: {
              build: {
                invoke: {
                  src: "buildFileTask",
                  onDone: [
                    {
                      target: "success",
                      actions: "assignFileOutputs",
                    },
                  ],
                  onError: [
                    {
                      target: "failure",
                      actions: "assignBuildFileError",
                    },
                  ],
                },
              },
              success: {
                type: "final",
              },
              failure: {
                type: "final",
              },
            },
          },
          buildTypeEntries: {
            initial: "build",
            states: {
              build: {
                invoke: {
                  src: "buildTypeTask",
                  onDone: [
                    {
                      target: "success",
                      actions: "assignTypeOutputs",
                    },
                  ],
                  onError: [
                    {
                      target: "failure",
                      actions: "assignBuildTypeError",
                    },
                  ],
                },
              },
              success: {
                type: "final",
              },
              failure: {
                type: "final",
              },
            },
          },
        },
        onDone: [
          {
            target: "cleanup",
            cond: "hasBuildErrors",
            actions: "reportBuildErrors",
          },
          {
            target: "emitEntries",
          },
        ],
      },
      emitEntries: {
        invoke: {
          src: "emitTask",
          onDone: [
            {
              target: "reportEmitResults",
            },
          ],
          onError: [
            {
              target: "cleanup",
              actions: "assignEmitError",
            },
          ],
        },
      },
      done: {
        entry: "reportBuildEnd",
        type: "final",
      },
      cleanup: {
        invoke: {
          src: "cleanupTask",
          onDone: [
            {
              target: "done",
            },
          ],
          onError: [
            {
              target: "done",
            },
          ],
        },
      },
      chmodBinEntries: {
        invoke: {
          src: "chmodBinTask",
          onDone: [
            {
              target: "done",
            },
          ],
          onError: [
            {
              target: "done",
            },
          ],
        },
      },
      reportEmitResults: {
        invoke: {
          src: "reportEmitResults",
          onDone: [
            {
              target: "chmodBinEntries",
              cond: "hasBinEntries",
            },
            {
              target: "done",
            },
          ],
        },
      },
    },
  }, {
    guards: {
      hasBuildErrors: ctx => Object.values(ctx.errors).some(Boolean),
      hasBinEntries: ctx => ctx.entries
        .some(entry => entry.key.startsWith('bin')),
    },
    actions: {
      reportBuildStart: assign({
        buildStartedAt: _ctx => performance.now(),
      }),
      reportBuildEnd: ctx => {
        const endedAt = performance.now();
        const elapsedTime = (endedAt - ctx.buildStartedAt).toFixed(1);
        ctx.root.reporter.info(`⚡ Done in ${elapsedTime}ms.`);
      },
      reportBuildErrors: ctx => {
        if (ctx.errors.buildBundle) {
          for (const cause of ctx.errors.buildBundle.esbuildErrors) {
            ctx.root.reporter.error(cause.text);
          }
        }
        if (ctx.errors.buildFile) {
          for (const cause of ctx.errors.buildFile.reasons) {
            ctx.root.reporter.captureException(cause);
          }
        }
        if (ctx.errors.buildType) {
          ctx.root.reporter.captureException(ctx.errors.buildType);
        }
      },
      assignBundleOutputs: assign({
        bundleOutputs: (ctx, event) => [
          ...ctx.bundleOutputs,
          ...(event.data as { outputFiles: OutputFile[] }).outputFiles,
        ],
      }),
      assignFileOutputs: assign({
        bundleOutputs: (ctx, event) => [
          ...ctx.fileOutputs,
          ...(event.data as { outputFiles: OutputFile[] }).outputFiles,
        ],
      }),
      assignTypeOutputs: assign({
        typeOutputs: (ctx, event) => [
          ...ctx.typeOutputs,
          ...(event.data as { outputFiles: OutputFile[] }).outputFiles,
        ],
      }),
      assignBuildBundleError: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          buildBundle: event.data as BuildBundleTaskError,
        }),
      }),
      assignBuildFileError: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          buildFile: event.data as BuildFileTaskError,
        }),
      }),
      assignBuildTypeError: assign((ctx, event) => {
        return {
          errors: {
            ...ctx.errors,
            buildType: event.data as BuildTypeTaskError,
          },
        };
      }),
      assignEmitError: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          emit: event.data as EmitTaskError,
        })
      }),
    },
    services: {
      buildBundleTask: ctx => buildBundleTask({
        context: ctx.root,
        bundleEntries: ctx.entries.filter(filterBundleEntry),
      }),
      buildFileTask: ctx => buildFileTask({
        context: ctx.root,
        fileEntries: ctx.entries.filter(filterFileEntry),
      }),
      buildTypeTask: ctx => buildTypeTask({
        context: ctx.root,
        typeEntries: ctx.entries.filter(filterTypeEntry),
      }),
      emitTask: ctx => emitTask({
        context: ctx.root,
        outputFiles: [
          ...ctx.bundleOutputs,
          ...ctx.fileOutputs,
          ...ctx.typeOutputs,
        ],
      }),
      reportEmitResults: ctx => reportEmitResultsTask({
        context: ctx.root,
        bundleOutputs: ctx.bundleOutputs,
        fileOutputs: ctx.fileOutputs,
        typeOutputs: ctx.typeOutputs,
      }),
      cleanupTask: ctx => cleanupTask({
        context: ctx.root,
        outputFiles: [
          ...ctx.bundleOutputs,
          ...ctx.fileOutputs,
          ...ctx.typeOutputs,
        ],
      }),
      chmodBinTask: ctx => chmodBinTask({
        context: ctx.root,
        binEntries: ctx.entries
          .filter(filterBundleEntry)
          .filter(entry => entry.key.startsWith('bin')),
      }),
    },
  });
