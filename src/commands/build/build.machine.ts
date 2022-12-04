import { performance } from 'node:perf_hooks';
import { actions, assign, createMachine } from 'xstate';

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
import { buildTypeTask } from './tasks/buildTypeTask';
import { chmodBinTask } from './tasks/chmodBinTask';
import { cleanupTask, type CleanupTaskError } from './tasks/cleanupTask';
import { emitTask, type EmitTaskError } from './tasks/emitTask';

export const buildMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QCMCuBLANhAsgQwGMALdAOzADpkB7agF1joCc8AHAYgCEBVASQBkAIgG0ADAF1EoVtVjo66aqSkgAHogCMAVgAsFAJz6AbBtEajAZgDsWizqtGANCACeiLaIsGrGi7YsaAEw2phYAvmHOaFi4hCTkVBjYAKKkzOhw7BBKlIx4dJTR2PjEZIVJEKnpcGKSSCAycgpKKuoIABw6+hQW+qKB+qb2Rjbtzm4IQaJ6OoFaWj7tgRbLdhFRFSXx5TFVTBmwWTkUeQWJMVtl5ylp+zUaddKy8orK9W0rGj2Bs35GZvplmNXJpAtMKLN5jojLN9H4-OsQEVYqUEsi9gdrhBOKhSBBMGAMXAsUcEmQAG7UADWO2KcSu6NumOROLxBKJsCxCAp1AI+VetVqKkaLxa70QRn+FFE7S0g2MJnhOnG7jlFA0Dn0VnsOgsIws7URyMuaIqHKxrPxhKZxOR7DATCY1CYFFYmHyADNnQBbLEm2mVG2clm4q3m5Hc0iUvnNUiCiTC56x1oSqUyuUaBW+WzKkEIIxaIwUKx69oFrqibU6DRGzb0027INYgBiWGt1WDFVJlB5NL99YD4YqrfZTYjPJjAokQvqIuT4vzBoolmr018Nn6VhVHS1BkCnR+Ols8wGtYuA6xQ5iI-bd07MXtjudrvddC9TF9xovjI7LbbV+wSNo35JR40eBok1eFNF3aZc7CGdcPGCbdDC0CF2naAItDBUQjGWQIzzpVFBzHCoABUXFYW9mS7bIySjakA39S9SJiCiqIAiAgN5EC42nBNZ0gsVQDaSxYKrdopg0DUNAw7dAh+PdjHaGxCJRbYWN-ZF2Oo20uwdJ0XTdT0fX7YjNLvLEdM47jJ1A-jwLnKCFzE4sdB0SSwWkxZgQmFZAnQ-QFiWexK08NTmLAb15A5bsKF7JiLyimKg1s3iwMTJpnJExB9ysZc+nXKx9A83xOm3bRMwhYxoV1OwtHaLUIqS6K6FiuiewYvsv3M5K2tSid0unB5MtFN4coQbCAtmKwy1m6YoX0CqYVEChdA0HRRHmJZCwCZreta2KDOfYy31MnqNL6jk0tjDLBKy4S1HcYxiyMTCZX+TMAl8zQ-Hy-pMMPaZGp0faNIIAk8FIVAOA6+KusS8yIbAKGYZuqdxBnJ4HvGp6OgLaV9wCOxpjheYKo8NCYUMasGr8YIjDBq5kdRjhjqM1930-Oskch6HWHR+zMYE7Gxugss0M6MsNqsQJTE6CwKZUihZVwuw3p8QZQciJEefBohvWobEyHa44ErM-XDeN0hrsG26HNG+cJrw1bRDMImSpMWXcwmDVAiLDV4S2+mxKZhJiCtzgTaDR9DJfEyPwt5mDaNqObYGhi7L44XHKE3HRLBFW5ZMcwghGQIKqsEtpVkjyjGMDbSwiHXSCNuAVAuspHeyvGAFprAhMEq-diwzHsOxt176sDEMFSq8BWZGvCHXO7RWgGGYNhu8etpTDW4qFP0FT69lf2nDzbCizdwZpmmaFTEZle9YZM0g23-PEAsAIDHcswx6-vCGhtzQm8JKDUxVJRV39mHEiWkKiWlHB2d+0EDSrWrICSw5hZZBAcMAqwq0cLVhUh4SwBYYEWRojEBBul7zYGQQuReEJMz+wCOXHB58JgLC8PYOYR5vJgkauQn8lkQxshoScVABACBwHgPdMWC4+irQcAMLUfQDzWG3A1L4ykxJzQEfoIRr84FUNDIgyyHo8BYFQEwMA9CJqKNeio4qMpfhbjzCMbo2FT4NxmnCQxjZjHYBvByOxeNrDdBKptUwjc9Ry23O0GUBgtCyTlL0Qw0Cn7nnMsIyhQT-ysToXIp2eMZo-yif-WJQC8yDACgpNJHlggykkv4m4gSIDBKbLASR0jYCyNFsUtosovDJPruYSwG5kLVMLrLN2GEFj4IwjWTJRENI5L0tefJv4LFWJsaEwZtg1rmEGJKawSE3G+zMLBYIhhiorFpp0FpgY2nWTfkUnuHwEneEGCpMwMliEVT8EkrC-sPJfzLMvDYWTVlGJEeRSi4jkR7MQIw1Rsl8HeTRVoeSvQKAKWwsFEsx5zCPM4i838XSpEyKRR0bC6ENSSTdg1OUPtcr2GLHLPw5hlhEsfpClZL8AmwrYvC802zMDWNsW8neiBT50tmqYLasoSrbnqrizyrjcJbXsOQq6rz+nvM-keHoH1pLTALPMAsALCw9FYaQ6sHKrDkI6tSpV6o5mViPLtWSld+hurPtJAIgwll8vUszPmMMXUwmNYWfBcJoRLEVnmbMAcui9A2v7EqPxyER1TtHJBUqP4IDsF4N6gCMKjwcJ4c5mh8EBRGFWWa2FrDVmbmEIAA */
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
        outputFiles: OutputFile[];
        errors: {
          buildBundle?: BuildBundleTaskError;
          buildFile?: BuildFileTaskError;
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
                      actions: "assignOutputFiles",
                    },
                  ],
                  onError: [
                    {
                      target: "failure",
                      actions: "assignBuildBundleErrors",
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
                      actions: "assignOutputFiles",
                    },
                  ],
                  onError: [
                    {
                      target: "failure",
                      actions: "assignBuildFileErrors",
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
                      actions: "assignOutputFiles",
                    },
                  ],
                  onError: [
                    {
                      target: "failure",
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
              target: "chmodBinEntries",
              cond: "hasBinEntries",
              actions: "reportEmitResult",
            },
            {
              target: "done",
            },
          ],
          onError: [
            {
              target: "cleanup",
              actions: "assignEmitErrors",
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
    },
  }, {
    guards: {
      hasBuildErrors: ctx => Boolean(
        ctx.errors.buildBundle ||
        ctx.errors.buildFile ||
        ctx.errors.emit
      ),
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
      reportEmitResult: ctx => {
        ctx.root.reporter.info('%o', ctx.outputFiles.map(file => file.path));
      },
      reportBuildErrors: ctx => {
        if (ctx.errors.buildBundle) {
          for (const cause of ctx.errors.buildBundle.esbuildErrors) {
            ctx.root.reporter.error(cause.text);
          }
        }
        if (ctx.errors.buildFile) {
          ctx.root.reporter.captureException(ctx.errors.buildFile);
        }
      },
      assignOutputFiles: assign({
        outputFiles: (ctx, event) => [
          ...ctx.outputFiles,
          ...(event.data as { outputFiles: OutputFile[] }).outputFiles,
        ],
      }),
      assignBuildBundleErrors: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          buildBundle: event.data as BuildBundleTaskError,
        }),
      }),
      assignBuildFileErrors: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          buildFile: event.data as BuildFileTaskError,
        }),
      }),
      assignEmitErrors: assign({
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
        outputFiles: ctx.outputFiles,
      }),
      cleanupTask: ctx => cleanupTask({
        context: ctx.root,
        outputFiles: ctx.outputFiles,
      }),
      chmodBinTask: ctx => chmodBinTask({
        context: ctx.root,
        binEntries: ctx.entries
          .filter(filterBundleEntry)
          .filter(entry => entry.key.startsWith('bin')),
      })
    },
  });