import { performance } from 'node:perf_hooks';
import { assign, createMachine } from 'xstate';

import { type Context } from '../../context';
import { type Entry } from '../../entry';
import {
  filterBundleEntry,
  filterFileEntry,
  filterTypeEntry,
  type BundleEntry,
  type FileEntry,
  type TypeEntry,
} from './entryGroup';
import { type OutputFile } from './outputFile';

export const buildMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QCMCuBLANhAsgQwGMALdAOzADpkB7agF1joCc8AHAYgCEBVASQBkAIgG0ADAF1EoVtVjo66aqSkgAHogCMANi0UAnFtF6AzAHYArABoQAT0TmATLtOnRADgeitG01otuAXwDrNCxcQhJyKgxsAFFSZnQ4dgglSkY8OkpQ7HxiMmyYiHjEuDFJJBAZOQUlFXUENwAWPQpjPVEHPQ1RJt9-azsEDU8miiaHc3NTDQ9jB2NjJqCQorzIwrCSpiTYFLSKDKzosPWCk7iEnbKNCulZeUVlSob5jTaHCeNzQw09Bbcg00o3Gk3MTS0ExM5m+KxAOXC+SiCO2uwuEE4qFIEEwYFRcHR+yiZAAbtQANabXIRc4oq5ohGY7G4-GwdEIUnUAiZJ7lcoqaqPOovRA6UQUSHmZrfURS8x6JpAhAw96dQzGDQtJqarxwhFnZFFVnopk4vH0gkI9hgJhMahMCisTCZABm9oAtuiDVTiha2YysWbjQiOaQydzaqQ+RIBQ9I-VRYYJU0pU0ZXKFUqtA43BQMw4C9qHD09Hq1jTDVs-eiAGJYc2lf1FImUTmUr0Vn3Bop1lnVkOciO8iT8yqC+MihBadoSrT-Nw9WVueWK2yINxmCgjBYWJpuDwLhxl06d9HdsK9hvXJtha22+2O510N1MT36090xu1+vn7Ch8M8ko0Z3FUcZPAmU4zjo86Lhmq5DCYYxaB4TjZt83zaMe1JIl2-ZFAAKjYrBXgyzapMSYYUj63pnnhYSEcRv4QP+XKAVGI4xmOYHCqADTTrmphNHuIyiBoPizICa4IIW+hdMhFhYYiGy0V+CIMSRlrNjadoOk6roeh2OEqde6LqUxLFDkBHEgeO4GTvxFCCcJnhiTM+5KvMDjjG4ejTB4fSiK4xiKTRYDuvIrIthQbbUaeYURX6FlscBsY1HZvGiqI4p6G4FguGmrg9BoSoaFKuYOKYiGanO7TBcE8LlkZ8V0JF2kPnpz4Ge+TXhS1iWDsl1mpUKzwZcqBiOchxjuL8JizCV3ymBQnQbp8TS9D5yxwqQ1AQHAKjdRsw0TmNAC0WhKqd2r6Hot0VflPimEe9WHbStAMMwbDHelaiIBMSo-F53hSjMUJCUsIUfkafrfTxv0IIsXl6JVsyFeJuVWFJEL6L4PzaPuC7NFokNGZ+JkBsyGnwFxaVw68bjZSjuWiejFhKkJXm9AqpjGDoPOTG4xMvY1ylk6RYSmn2qlFLDo3wxMubI90zOuajmNDOC5gfNoomC-0Uok6L0PSxLgZSyZsCoAQBBwNT9y03LDQdO8nn-D4jj-MjAMwhQC6+L53j64EwsnqTxvk0UktUxQLp4FgqBMGAssQc7HxdMWFjp17UlaOYLsuFK06QoJ3iG7S4fi9gl6ssnk7GAzOPK2jbls1Jgm5pqUojFKTgdOYZeVpcJtVz+dHYLXY0K43qMsy36vrnn4w+AqhezNoW2rKHRtVsPEDV9WlvW7bE-w8uYxTJ40JLiuSrLq03Tre03hr5CA+4bv+9frH8eJyfDRn3mRwRh0x33gogXyS0+i1VEN8Amfg37GUrhAMyMMaYjQgvXRmTdZ5qwWlrXyGoviFUmHVTe2Ft5DwjvRIi0cER-z+jmaeKtWbz2kjOAsjg-I8xhHnIWZClLlx3lQ7AKCvyHxtrAO2oEHYQWXF5YSpgFxZTgkqT4S0noaAwmhHhmEQ7kMEZQpBoiTLf0wAnJOaCTqn0cN5HwSjr6ZikksLWOYRhEK8LKPoCDmo10sT9V4KY2gzRzPXcwXhkJ4KWjlGYvQNSzGRgg8Rx8-F03XDoNo-xHAtGLDlQWJUpjvC6LzSEJClYINMeY+hjRIRBJ+K4RCyEFh4N0JqEwD9e4TC2kEIAA */
  createMachine({
    tsTypes: {} as import("./build.machine.typegen").Typegen0,
    schema: {
      events: {} as {
        type: "BUILD";
        entries: Entry[];
      },
      context: {} as {
        root: Context;
        buildStartedAt: number;
        bundleEntries: BundleEntry[];
        typeEntries: TypeEntry[];
        fileEntries: FileEntry[];
        outputFiles: OutputFile[];
      },
    },
    id: "buildMachine",
    initial: "bootstrap",
    states: {
      bootstrap: {
        on: {
          BUILD: {
            target: "buildEntries",
            actions: [
              "assignBuildStartedAt",
              "assignBundleEntries",
              "assignTypeEntries",
              "assignFileEntries",
            ],
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
                      actions: "assignBuildTypeErrors",
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
            target: "failure",
            cond: "hasErrors",
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
              target: "success",
            },
          ],
          onError: [
            {
              target: "failure",
              actions: ["assignErrorCode", "assignEmitErrors"],
            },
          ],
        },
      },
      success: {
        entry: ["reportResults", "reportPerformance"],
        type: "final",
      },
      failure: {
        entry: ["reportErrors", "cleanup"],
        type: "final",
      },
    },
  }, {
    actions: {
      assignBuildStartedAt: assign({
        buildStartedAt: (_ctx) => performance.now(),
      }),
      assignBundleEntries: assign({
        bundleEntries: (_ctx, event) => {
          return event.entries.filter(filterBundleEntry);
        },
      }),
      assignTypeEntries: assign({
        typeEntries: (_ctx, event) => {
          return event.entries.filter(filterTypeEntry);
        },
      }),
      assignFileEntries: assign({
        fileEntries: (_ctx, event) => {
          return event.entries.filter(filterFileEntry);
        },
      }),
    },
  });