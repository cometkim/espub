import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
import { assign, createMachine } from 'xstate';
import dedent from 'string-dedent';
import prettyBytes from 'pretty-bytes';

import * as formatUtils from '../../formatUtils';
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

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

export const buildMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QCMCuBLANhAsgQwGMALdAOzADpkB7agF1joCc8AHAYgCEBVASQBkAIgG0ADAF1EoVtVjo66aqSkgAHogCMAVgAsFAJz6AbBtEajAZgDsWizqtGANCACeiLaIsGrGi7YsaAEw2phYAvmHOaFi4hCTkVBjYAKKkzOhw7BBKlIx4dJTR2PjEZIVJEKnpcGKSSCAycgpKKuoIABw6+hQW+qKB+qb2Rjbtzm4IQaJ6OoFaWj7tgRbLdhFRFSXx5TFVTBmwWTkUeQWJMVtl5ylp+zUaddKy8orK9W0rGj2Bs35GZvplmNXJpAtMKLN5jojLN9H4-OsQEVYqUEsi9gdrhBOKhSBBMGAMXAsUcEmQAG7UADWO2KcSu6NumOROLxBKJsCxCAp1AI+VetVqKkaLxa70QRn+FFE7S0g2MJnhOnG7jlFA0Dn0VnsOgsIws7URyMuaIqHKxrPxhKZxOR7DATCY1CYFFYmHyADNnQBbLEm2mVG2clm4q3m5Hc0iUvnNUiCiTC56x1oSqUyuUaBW+WzKkEIIxaIwUKx69oFrqibU6DRGzb0027INYgBiWGt1WDFVJlB5NL99YD4YqrfZTYjPJjAokQvqIuT4vzBoolmr018Nn6VhVHS1BkCnR+Ols8wGtYuA6xQ5iI-bd07MXtjudrvddC9TF9xovjI7LbbV+wSNo35JR40eBok1eFNF3aZc7CGdcPGCbdDC0CF2naAItDBUQjGWQIzzpVFBzHCoABUXFYW9mS7bIySjakA39S9SJiCiqIAiAgN5EC42nBNZ0gsVQDaSxYKrdopg0DUNAw7dAh+PdjHaGxCJRbYWN-ZF2Oo20uwdJ0XTdT0fX7YjNLvLEdM47jJ1A-jwLnKCFzE4sdB0SSwWkxZgQmFZAnQ-QFiWexK08NTmLAb15A5bsKF7JiLyimKg1s3iwMTJpnJExB9ysZc+nXKx9A83xOm3bRMwhYxoV1OwtHaLUIqS6K6FiuiewYvsv3M5K2tSid0unB5MtFN4coQbCAtmKwy1m6YoX0CqYVEChdA0HRRHmJZCwCZreta2KDOfYy31MnqNL6jk0tjDLBKy4S1HcYxiyMTCZX+TMAl8zQ-Hy-pMMPaZGp0faNIIAk8FIVAOA6+KusS8yIbAKGYZuqdxBnJ4HvGp6OgLaV9wCOxpjheYKo8NCYUMasGr8YIjDBq5kdRjhjqM1930-Oskch6HWHR+zMYE7Gxugss0M6MsNqsQJTE6CwKZUihZVwuw3p8QZQciJEefBohvWobEyHa44ErM-XDeN0hrsG26HNG+cJrw1bRDMImSpMWXcwmDVAiLDV4S2+mxKZhJiCtzgTaDR9DJfEyPwt5mDaNqObYGhi7L44XHKE3HRLBFW5ZMcwghGQIKqsEtpVkjyjGMDbSwiHXSCNuAVAuspHeyvGAFprAhMEq-diwzHsOxt176sDEMfRMJhP6jy0MPCloBhmDYbvHraUw1uKhS581WV-acPNsKLN3BmmaZoVMRmdc7hsbg7Lf88QCwAgMdyzDHj+8I0bc0JvAFisJ4ToMpZZzBXhZGiMRLSjhfvdMWC4DSrWrICSw5hZZBAcIA0BFAcK9CCtqSwPhoE-ksiGNkul7zYFftBWYsF0H+wCOXHBp8JgLC8PYOYR5vJgkauQs0rFsDwJoScVABACBwHgEgp2eM+irQcAMLUfQDzWG3A1L4ykxJzQEfoIRjYtIVDEeaD0eAsCoCYGAehC5FGvRUcVGUvwtx5hGN0bCx8G4zThIY5+lDhz-iDLYia1huglU2qYRueo5bbnaDKAwWhZKDELLLSUfjAzGOvEErJdC5E9zaDNL+kTf4xIAXmQYAUFJEI8sEGUkkMmcRvOaWAkjpGwFkaLeRbRZReCSfXcwpCkKuImICJROEMILFARhGsD89YMmEbkiAzSmzmMsdYkJeNelrXMIMSU1hhkVTMLBYIhhiorFpp0RpIiIDWWCfk7e794neEGCpMwMkVJaAqn4RJARDzeS6NcpZdylmbMKfuF5slQHeShV8vMyxugKWwsFEsx5zBAoCWxSi4jWlSJkWCxAx90Iakkm7Bqcofa5XsMWOWfhzDLDRffDY55zIUNgdgEFlk1mYCsTYh5b8OjYWJbNUwW1ZQlW3PVAhnkXG4S2vYaBV17ldIKe-I8PQPrSWmAWeYBZvmFh6KwywMIgjrmgR1AlgruiyVVtqXV31K79HVEsSU0kAiDFmcyoi4M+Yw0tWWPQo9UmiDhNCJYis8zZgDl0XoG1-YlR+NAiOqdo6IJVY8hAdgvBvX-hhUeDhPAjM0KAgKIwqyzWwtYaszcwhAA */
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
                      actions: "assignOutputFiles",
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
                      actions: "assignOutputFiles",
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
                      actions: "assignOutputFiles",
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
      reportEmitResult: async ctx => {
        const relPath = (filePath: string) => path.relative(ctx.root.cwd, filePath);

        const bundleOutputs = ctx.outputFiles.filter(outputFile => outputFile.path.endsWith('js'));
        for (const bundle of bundleOutputs) {
          const [gzipped, brotlied] = await Promise.all([
            gzip(bundle.content),
            brotli(bundle.content),
          ]);
          ctx.root.reporter.info(dedent`
            📦 ${formatUtils.path(relPath(bundle.path))}
              Size      : ${prettyBytes(bundle.content.byteLength)}
              Size (gz) : ${prettyBytes(gzipped.byteLength)}
              Size (br) : ${prettyBytes(brotlied.byteLength)}
          `);
        }

        const fileOutputs = ctx.outputFiles.filter(outputFile => outputFile.sourcePath);
        for (const file of fileOutputs) {
          ctx.root.reporter.info(dedent`
            Copied ${formatUtils.path(relPath(file.sourcePath!))} to ${formatUtils.path(relPath(file.path))}
          `);
        }
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
          ctx.root.reporter.captureException(ctx.errors.buildType.cause);
        }
      },
      assignOutputFiles: assign({
        outputFiles: (ctx, event) => [
          ...ctx.outputFiles,
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
      assignBuildTypeError: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          buildType: event.data as BuildTypeTaskError,
        }),
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