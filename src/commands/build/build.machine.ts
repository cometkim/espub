import { performance } from 'node:perf_hooks';
import dedent from 'string-dedent';
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
  /** @xstate-layout N4IgpgJg5mDOIC5QCMCuBLANhAsgQwGMALdAOzADpkB7agF1joCc8AHAYgCEBVASQBkAIgG0ADAF1EoVtVjo66aqSkgAHogCMGgEwUAnKO0BmHaIAcAdj0BWa9o0AaEAE9EAFlF6K2s2Y163ADZtN0tQ6wBfCKc0LFxCEnIqWgZmNnYAYX4AUQBBADkxSSQQGTkFJRV1BABaMyMKCyMQi2Mjcw89MydXBFtdIyNAs20LDSttAyMomIxsfGIySljsbNJmdDh2CCVKRjw6Zbn4xaSViDWNuCKVMvlFZRLqszcvIwNJjVE3C0CLa26Lk02m+FDc2lsYxGzUGbhmIHOC0SRzilyYm1g212FH2hyoxyRS3xqPW6OuGmK0lk90qT0QzQ0FGa4KM1kCon8xkBvVMbjBEOsQXBelZrPhiISRPOaIxxOwnFQpAgmDAMrgcogWKSZAAbtQANYo+aSs7HNWwDUKpUq80ahC66gEA4PIo3Ep3CqPUDVQLsijmax6L7-GwWDk9TRGPk+Iz1Nw-Nm-IwWcUEk1Gi6k2XnK3K1VZ9XndhgJhMahMCisTAHABm5YAthrCaaSVcLTnFXnbed7aQ9U7Pa6JLdqZ6qohfaJ-WZA8HA9Yw44gQhjIyXsmIdotxYgsNU3Fmxnu8cAGJYfNtjVaygOw1N9Ma49xM82gvt469-vOpRDymlUcPOOCCBLGFAgW4XwQcm1iiCYEYIKEuijCC9Rhu8OgptECJpqcR5vhqL4XmS75xMWpblpW1Z0HWTCNhKuGPvh5yEU+2Cfo636kL+I7lIBdLAaB4GQRo0GwUuvQLl49T+DubgwV00xYfRyKMZe5wACrOKwRHZsc14ULeGaHqpxEapp2msRA7EDi6EhulSvG0t6E6gbJVgiSKQxbvB0n6P4QaCno7IWCF+7Ggx0pMcc5k6YWeklmWFZVrWDb3hFZpRXEMWWdZnHce6AFOWoLlmI08bue8gzBNo8F6JMYJWGYojBG4JihGFJwqWA9byOa+mGWlXU9XQ5q5YOdnDgVjlesVCBRqV1gaCMgStWM2i+v88EaEEugeJMTRLa0ViYbMB4Pt1vVvmRiWUSltGDUSF0jW+Y22eI9n-tNQGBoEjTDO0Zjsv4JjcpGC7+jGIQeKEAQdcZBAqngpCoBwOzan2BpGQ+CNgEjKOvT+E1-h6fHOQggPWBD0lRt8Iq2FtMGUytegBBoAKsqMgRw9jiPIxwCUUcl1GpcpRI43jrAE1xRM8TSM3PIElMvID22tF864M5YFAzs1UbDGMQZwkpOEqcQ9bUBAnBkH1aM3hjd6i0kZsW1bpCjQ6NmE+9k0OXLQHBFOogcjGASBOMIRba0v3jKKojWBzIFmNzDHO5b1tXQLSVUTRdEm2LRDm2nbsvR7eUy1Nfv8QH2v2GHGhh+trSR00-pLaEgRBdtQxJ8bZ0MUwYAyEwI3DQASnAqCYAw-X21j-eD+WI-yOPsCTwwUv5b7Y78TUowUCJcbhK1TWWNYW0gZTrIQf8vi+mz2jJypA9D0vdAr2vmK2wZs8PUkz+L9kMeE8p6wA3nZCkstt5k1eKVZotcTDs02sueurImSCnGACQGYdIi93CqbXmKMzxMEYDPPUDs85OwIawIhjAwHe2JoVeWiAahRkpgfWwfh2ZxzPsuRWug1YBF8FuduRtTp4LFlQmhdBrqC2ziLChlBxZ8ykXQj6JMirVBYfGMEfwuhB08OyPQFh4JhkDiFbu0NOh6CiFhUgFs4AqEdmASBpNZosJFPvWMHC2b1G4fBGoOhSps27iFNC7QNCPylCkRgLBWAuI0cwoM2swyvA5D8Lond4KtV0KIHcis7As3Wn4LmuDOpSgym2eJTC5omH0PGDkaSqohB4b0GoHgwI7kWt3eooxYalOMpFNSxxcyvkqRXKBs1YxTggnVQU605mhyyb9Jqu5YIij+OCB+-SHyDNMh2a0sUSLYCqUBcEpUZkQnBIrYUQQtqhAoJJaGLw6paHjpElsqxMryk7KM0yq8CAEDgPAcZrjqgGCnL8SYZhwW+mhgzCw-p-gwMDC84J7y8JDLiCMw5FAax4CwKgAeJz+Lgr+lCmFK1vjwUuWBUU0K9Y+DbuikyulnznnNMSsmyYvABA8F8LuXk5LwXeHyCYlh-JBX6IpMRZSPmZkxdgFiXyICctmuCBFvKGkCpai09wQUHl-GubktygNmW7NZYq9l+F-mAtgMCreoLEAzgaItDu9cQL-DEvBRm-oPU-BGCakpMqBkVL2aeK1l48UEqJSChJ5N44PPrkGX0ok4K8MMGBYwicFxySWls4NOzQ0WogNlN8qrqhTP0O5FNnlghGBMdo+paF3IjEMGaotcUspaRxecct7gfBVuTSBWtxgfJBG8GzcIgNO4+Hba2MNXaLLWtQACoFfb427T8L8WCp9DCg3jaK15Vgw4zp7gW9K87i2lsjfizAhLnGxuqTOTd4x2Sxk9T4WqdhvBjB+LBX0-183YT7kNS6YyHVxtYUycwddvj5LZLqhAIk2RMhMCmlaOgRInWA+IpItt10zi8EtHWnS2Qg0jhmvNd8RL+C0MypRKMCMrWg4mTwetoRbVZNHV46ErkBBCPRguLt07gc+pXLlrUwKA3sL4do27kwUd0H8E1dhkwQWZf-YegDl7AIYOuwYDRc2A2+JYd4nhEP3w1SzGjTVJiCmw04igDHqHoGIXQddATBhMjDsmF43wdxYfgn8SmxrRTBGdV0GxEQgA */
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
      invoke: {
        src: "cleanupTask",
        onDone: "bootstrap",
        onError: "bootstrap"
      },

      entry: "reportCleanupStart",
      exit: "reportCleanupEnd"
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
      reportCleanupStart: ctx => {
        ctx.root.reporter.info(dedent`
          Cleanup outputs first

        `);
      },
      reportCleanupEnd: ctx => {
        console.log()
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
        outputFiles: ctx.entries.map(entry => ({
          sourcePath: entry.sourceFile[0],
          path: entry.outputFile,
        })),
      }),
      chmodBinTask: ctx => chmodBinTask({
        context: ctx.root,
        binEntries: ctx.entries
          .filter(filterBundleEntry)
          .filter(entry => entry.key.startsWith('bin')),
      }),
    },
  });
