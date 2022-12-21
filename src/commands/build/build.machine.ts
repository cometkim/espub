import { performance } from 'node:perf_hooks';
import { assign, createMachine } from 'xstate';

import { type Context } from '../../context';
import { type Entry } from '../../entry';
import {
  filterBundleEntry,
  filterFileEntry,
  filterTypeEntry,
} from '../../entryGroup';
import { type OutputFile } from '../../outputFile';

import { buildBundleTask, type BuildBundleTaskError } from '../../tasks/buildBundleTask';
import { buildFileTask, type BuildFileTaskError } from '../../tasks/buildFileTask';
import { buildTypeTask, type BuildTypeTaskError } from '../../tasks/buildTypeTask';
import { chmodBinTask } from '../../tasks/chmodBinTask';
import { cleanupTask, type CleanupTaskError } from '../../tasks/cleanupTask';
import { emitTask, type EmitTaskError } from '../../tasks/emitTask';
import { reportEmitResultsTask } from '../../tasks/reportEmitResultsTask';

export const buildMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QCMCuBLANhAsgQwGMALdAOzADpkB7agF1joCc8AHAYgCEBVASQBkAIgG0ADAF1EoVtVjo66aqSkgAHogCMGgEwUAnKO0BmHaIAcAdj0BWa9o0AaEAE9EAFlF6K2s2Y163ADZtN0tQ6wBfCKc0LFxCEnIqDGwAUVJmdDh2CCVKRjw6SljsfGIyYpSIdMy4MUkkEBk5BSUVdQQzNy8jA209DVE3C0CLazMnVwRTNwo3bVsLDTNjYyM3KJiqssTKuJqmLNgcvIoCouS4nYrLtIzDuo0G6Vl5RWVGjqN7Cm-5o2sgVE-mMExcmm0QzmC2sQXmegBAM2IBK8XKSVRByOtwgnFQpAgmDAWLgOJOSTIADdqABrPalBI3TH3bGovEEokk2A4hBU6gEQrver1FTNN5tT6IQJAijmawDURjGwWYGTTTrbxmIxatzDQEjIwWZGo64YqpcnHswnElmk1HsMBMJjUJgUViYQoAMxdAFscab6dVbdy2fjrRbUbzSNSBa1SMKJKLXnH2lKZXKFUrrCrHOCEMYNBQuoaFtoyxYgoEzMbtoyzftgziAGJYG21ENVcmUPl0-11wMRqotzmNyN82NCiQixpilOShCBbUURduQarw3WUQmNUIUK6bQWSFalW9HRG6Io2vogejoetwdxB1Ol1uj10b1MP0m-s4h-YYdtg8HZxFGMaCkoCbPE0ybvKmC5Liua4aBuW65lM2ZeFq-gVm4m56FqNZXD+zLtjiAAqzisIBrKdrkFLRrSgYBr+t5xBRVF-hAoH8uB8ZTomM4wRKoAdIuZgUDhVjIQiRjBNoO5Yfo-gDLCehAhYGmEQy14saRqLsdRdqdo6zquu6Xq+n2OkkUB5GUYZwHYNxE4QfxUGzrB85iRJupSb0RiyWWO56P0cxWGYojBG4JihFpaK7BQYA+vIXJdhQPZMT+SUpcGzm8ZBSYtJ5ImIOs4nWMs2iBNFSxVaM1g7hoQS6B4-QWCYlgHno55bEROnZXQqUmS+5nvpZ379clg25eO+VuYV4ofCVCDyoEElVkY5hAv4HWNQCFiyj4fweKEARxcxBBEngpCoBwdHdgxvYTQll1gNdt15XGBWCUVwlqIgZiBNYh1YesQwIrYjWbsD1V6AEGjjACB6BOdP6ve9HDDWZb4fl+V4vVdN2sJ9k7iNOLy-Ut-2dEDRahIETWHoMxZQ5YRabiuVZLAMGwXs9NzED61C4mQqX3elj2ZTpgvC5woszQxLl8WTAkU4tcHBKIsrAkdAQM4ebiNYea0aO11ibebdhiaj0tEELIukENz7YxZn5WS9duy-L7Yk65KvuUJVOiZCRb2AzGgM1Vh5G+1srLPTalNbJ1Z8-jNxMGAMhMINU0AEpwKgmAMGlGXu+nmcujn8j57AhcML7yvk9BlNwQAtAeFDITq4TRRFlgNXmEcAr8sKm+MgMM3YNsJRnWdV3QNd18c4ul-zSSz5XqR5wXRewA3wpPAtc7Ld04nfGHJiI2MjWLsDAKrmMvjSgj09MrQDDMGw7AAML8KkACCAA5JuHk-odFboMYGfhgTZl6GYGwkI0KIFhOJLoAx1ibSqq1V+SR0ZExbEwRgXA+BCBAYHOCWhdB9B8KpJmohsw7nqhJdq3VFxqVsPhKIF5SDCzgCoNeYAj7FWphAvwvwGaGi6EMCsyELA7ggT4Tu5sqzIXoVoEKODijv0YCwVgQiwGIAgchfQoQx5h0GJFQ2eZoq6EVEEWw-QQoqM0bpIC+ig6lRMCYjwgwk6BVwvIjwy4cIBAMN1BG2oXE2RonEK0I52zuLgtqLWq4QqwiqukvWO4ghFiGKMSEohzCHiRKnPqCVolGViWGeJtlUSJPnPMcSqSFjzCBvCIIjVQgUAwidNB9gIlRPNKxbAcSHJnFQAQAgcB4A-XVvOAwWsRj9HgYU6UJ0oYHUVKpMw8oQpaHNoMhsekqijItJ6PAWBUAZ3qctBZ61lkLLWUMHcLTlyIngesYIfguiHLuMcuIAEuQ3OpoaLwAQfHAmiv4geUxeizCsP0ewZYFSWF+UGf5-57zDIgMCjo8wDrguBJCgKUUYXuDUt00YbTFSSUBmizigLGy10mdM3FANzbdIjgMaUKFtx5mhrKRcFYLArFpSjUp2lylDIxRARlpFzmXOubM4+1MdlGE5YEblQrNx8qmECXQwRZLamzLhSq9LsUGSBcq4RXwIr6CkjymShqdw4TmB4JYm5IrShFeamVlrsVst3Io7qWr-KBSMApHJ9gUHjE1ZHFOvVJVMmlbUqo-rSLMqmbAGZasVUdB2S1PwIwtz90MGCKYOz4X7KsAzROPhfWprYvZM5FzMBXMEdagxnQ7BzCLUCbUYwy3BR7QeRmW5pQbW0C4gaVrc02tKrhX4W0tB5NsICMl0wARrQChHRc1UdCyJcfdQNOyvDLB2XY2wi5lhG0MJ3FYz9kL+C0C4vBt0T3VSXfqTwnyVgRsHluzu3RTytICCEV9nsHazubnM5aGDlyA3sL4TaxbDS3oNRpXyBbDSrhcRvbOW9q47wYIGgK6rTWAyGJYXongN0Iw7nDdByxDA2GGK+wmt0CGMEDRAgK4jZFSOGOuOReYmE0sRF882nCuFAA */
  createMachine({
  tsTypes: {} as import("./build.machine.typegen").Typegen0,
  schema: {
    events: {} as (
      | {
        type: "BUILD";
      }
      | {
        type: "CLEAN";
      }
    ),
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

        CLEAN: "cleanupFirst"
      },
    },

    buildEntries: {
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
        }
      },
      type: "parallel",
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

    cleanupFirst: {
      on: {
        BUILD: {
          target: "buildEntries",
          actions: "reportBuildStart"
        }
      },

      invoke: {
        src: "cleanupTask"
      }
    }
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
        const hasBuildErrors = Object.values(ctx.errors).some(Boolean);
        if (hasBuildErrors) {
          return;
        }
        const endedAt = performance.now();
        const elapsedTime = (endedAt - ctx.buildStartedAt).toFixed(1);
        ctx.root.reporter.info(`⚡ Done in ${elapsedTime}ms.`);
      },
      reportBuildErrors: ctx => {
        if (ctx.errors.buildBundle) {
          ctx.root.reporter.error(ctx.errors.buildBundle.message);
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
