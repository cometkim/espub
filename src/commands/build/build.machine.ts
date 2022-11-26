import { createMachine } from 'xstate';

import { type Context } from '../../context';
import { type Entry } from '../../entry';
import {
  filterBundleEntry,
  filterFileEntry,
} from './entryGroup';
import { type OutputFile } from './outputFile';
import { buildBundleTask } from './tasks/buildBundleTask';
import { buildFileTask } from './tasks/buildFileTask';

export const buildMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QCMCuBLANhAsgQwGMALdAOzADpkB7agF1joCc8AHAYgCEBVASQBkAIgG0ADAF1EoVtVjo66aqSkgAHogCMANi0UAnFtF6AzAHYArABoQAT0TmATLtOnRADgeitG01otuAXwDrNCxcQhJyKgxsAFFSZnQ4dgglSkY8OkpQ7HxiMmyYiHjEuDFJJBAZOQUlFXUENwAWPQpjPVEHPQ1RJt9-azsEDU8miiaHc3NTDQ9jB2NjJqCQorzIwrCSpiTYFLSKDKzosPWCk7iEnbKNCulZeUVlSob5jTaHCeNzQw09Bbcg00o3Gk3MTS0ExM5m+KxAOXC+SiCO2uwuEE4qFIEEwYFRcHR+yiZAAbtQANabXIRc4oq5ohGY7G4-GwdEIUnUAiZJ7lcoqaqPOovRA6UQUSHmZrfURS8x6JpAhAw96dQzGDQtJqarxwhFnZFFVnopk4vH0gkI9hgJhMahMCisTCZABm9oAtuiDVTiha2YysWbjQiOaQydzaqQ+RIBQ9I-VRYYJU0pU0ZXKFUqtA43BQMw4C9qHD09Hq1jTDVs-eiAGJYc2lf1FImUTmUr0Vn3Bop1lnVkOciO8iT8yqC+MihBadoSrT-Nw9WVueWK2yINxmCgjBYWJpuDwLhxl06d9HdsK9hvXJtha22+2O510N1MT36090xu1+vn7Ch8M8ko0Z3FUcZPAmU4zjo86Lhmq5DCYYxaB4TjZt83zaMe1JIl2-ZFAAKjYrBXgyzapMSYYUj63pnnhYSEcRv4QP+XKAVGI4xmOYHCqADTTrmphNHuIyiBoPizICa4IIW+hdMhFhYYiGy0V+CIMSRlrNjadoOk6roeh2OEqde6LqUxLFDkBHEgeO4GTvxFCCcJnhiTM+5KvMDjjG4ejTB4fSiK4xiKTRYDuvIrIthQbbUaeYURX6FlscBsY1HZvGiqI4p6G4FguGmrg9BoSoaFKuYOKYiGanO7TBcE8LlkZ8V0JF2kPnpz4Ge+TXhS1iWDsl1mpUKzwZcqBiOchxjuL8JizCV3ymBQnQbp8TS9D5yxwqQ1AQHAKjdRsw0TmNAC0m4TIFhULKJfRLEqp3avoegvTlLiGKY6EhR+tAMMwbDHelaiaOK0z-F0uVzsuqFKo4uhZd0vS9BCPRaN9RmftegM8cDCCLF5eiVbMhXiblVhSRC+i+D8haGJCBbo8pmOkWEpp9o22OjbjxhuNlRO5aJpMWEqQleb0Crgl8hVTIztJGnR2BsxpN7YJzEETLmhPdALrnE+TQzguYHzaKJbh+H4Uqy5WlyqUUSvGrAqAEAQcDwFxaU4w0HTvJ5-w+I4-yE7DMIUAuvi+d4-SW-Vh1y1Wtus4G7MmS6eBYKgTBgGrk7ex8XTFhY+dB1JWjmD7LhStOkKCd4Vu4Qn2CXqy2djTzfPayTbnC1Jgm5pqYPND4zQMzHjVM-LDcQE3CsQC3uMa1THeC13+vrmX4w+BLZuzNoW2rCeGMTyZCLT1+jvO67c8NMuYxTJ40JLiuSrLq03Tre03g75CdfGSzjc-tWVO6dM5XzXrfRwRh0wv3gogXyS07omFEN8fcZtTA-2ZppeiRFlagLxrzRexNl56wWkbXyGoFhOA8KJHK6Cj5-wgGZGeuCF5a0IbrMmSoFitALI4Pyn0YRlzRqPA+4947HwItgh2TsXawDdvcD2XNr6OG8kPWC0DOF9EcsWDCaEBGYWEdhURNtxFYMYoAtOmAM5Z3diNCC0MVGmAXFlOCHkUwUBzCMKWXhZR9B-s1ZuNiTrczcdNM2OYebmC8MhEhS03o9DTGJHyaCDFKXOOfGRcjQIKLsToNo-xHAtGLDlM2JUpjvC6MYHQEwYRax-kAyxIDAlA2vpCNoso-CQIhHMEhuhNQmDfk4BUnwghBCAA */
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
      },
    },
    id: "buildMachine",
    initial: "bootstrap",
    states: {
      bootstrap: {
        on: {
          BUILD: {
            target: "buildEntries",
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
    services: {
      buildBundleTask: ctx => buildBundleTask({
        context: ctx.root,
        bundleEntries: ctx.entries.filter(filterBundleEntry),
      }),
      buildFileTask: ctx => buildFileTask({
        context: ctx.root,
        fileEntries: ctx.entries.filter(filterFileEntry),
      }),
    },
  });