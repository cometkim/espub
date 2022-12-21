
  // This file was automatically generated. Edits will be overwritten

  export interface Typegen0 {
        '@@xstate/typegen': true;
        internalEvents: {
          "done.invoke.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]": { type: "done.invoke.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.buildMachine.buildEntries.buildFileEntries.build:invocation[0]": { type: "done.invoke.buildMachine.buildEntries.buildFileEntries.build:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]": { type: "done.invoke.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.buildMachine.chmodBinEntries:invocation[0]": { type: "done.invoke.buildMachine.chmodBinEntries:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.buildMachine.cleanup:invocation[0]": { type: "done.invoke.buildMachine.cleanup:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.buildMachine.cleanupFirst:invocation[0]": { type: "done.invoke.buildMachine.cleanupFirst:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.buildMachine.emitEntries:invocation[0]": { type: "done.invoke.buildMachine.emitEntries:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"done.invoke.buildMachine.reportEmitResults:invocation[0]": { type: "done.invoke.buildMachine.reportEmitResults:invocation[0]"; data: unknown; __tip: "See the XState TS docs to learn how to strongly type this." };
"error.platform.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]": { type: "error.platform.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]"; data: unknown };
"error.platform.buildMachine.buildEntries.buildFileEntries.build:invocation[0]": { type: "error.platform.buildMachine.buildEntries.buildFileEntries.build:invocation[0]"; data: unknown };
"error.platform.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]": { type: "error.platform.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]"; data: unknown };
"error.platform.buildMachine.chmodBinEntries:invocation[0]": { type: "error.platform.buildMachine.chmodBinEntries:invocation[0]"; data: unknown };
"error.platform.buildMachine.cleanup:invocation[0]": { type: "error.platform.buildMachine.cleanup:invocation[0]"; data: unknown };
"error.platform.buildMachine.cleanupFirst:invocation[0]": { type: "error.platform.buildMachine.cleanupFirst:invocation[0]"; data: unknown };
"error.platform.buildMachine.emitEntries:invocation[0]": { type: "error.platform.buildMachine.emitEntries:invocation[0]"; data: unknown };
"xstate.init": { type: "xstate.init" };
"xstate.stop": { type: "xstate.stop" };
        };
        invokeSrcNameMap: {
          "buildBundleTask": "done.invoke.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]";
"buildFileTask": "done.invoke.buildMachine.buildEntries.buildFileEntries.build:invocation[0]";
"buildTypeTask": "done.invoke.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]";
"chmodBinTask": "done.invoke.buildMachine.chmodBinEntries:invocation[0]";
"cleanupTask": "done.invoke.buildMachine.cleanup:invocation[0]" | "done.invoke.buildMachine.cleanupFirst:invocation[0]";
"emitTask": "done.invoke.buildMachine.emitEntries:invocation[0]";
"reportEmitResults": "done.invoke.buildMachine.reportEmitResults:invocation[0]";
        };
        missingImplementations: {
          actions: never;
          delays: never;
          guards: never;
          services: never;
        };
        eventsCausingActions: {
          "assignBuildBundleError": "error.platform.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]";
"assignBuildFileError": "error.platform.buildMachine.buildEntries.buildFileEntries.build:invocation[0]";
"assignBuildTypeError": "error.platform.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]";
"assignBundleOutputs": "done.invoke.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]";
"assignEmitError": "error.platform.buildMachine.emitEntries:invocation[0]";
"assignFileOutputs": "done.invoke.buildMachine.buildEntries.buildFileEntries.build:invocation[0]";
"assignTypeOutputs": "done.invoke.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]";
"reportBuildEnd": "done.invoke.buildMachine.chmodBinEntries:invocation[0]" | "done.invoke.buildMachine.cleanup:invocation[0]" | "done.invoke.buildMachine.reportEmitResults:invocation[0]" | "error.platform.buildMachine.chmodBinEntries:invocation[0]" | "error.platform.buildMachine.cleanup:invocation[0]";
"reportBuildErrors": "done.state.buildMachine.buildEntries";
"reportBuildStart": "BUILD";
"reportCleanupEnd": "done.invoke.buildMachine.cleanupFirst:invocation[0]" | "error.platform.buildMachine.cleanupFirst:invocation[0]" | "xstate.stop";
"reportCleanupStart": "CLEAN";
        };
        eventsCausingDelays: {

        };
        eventsCausingGuards: {
          "hasBinEntries": "done.invoke.buildMachine.reportEmitResults:invocation[0]";
"hasBuildErrors": "done.state.buildMachine.buildEntries";
        };
        eventsCausingServices: {
          "buildBundleTask": "BUILD";
"buildFileTask": "BUILD";
"buildTypeTask": "BUILD";
"chmodBinTask": "done.invoke.buildMachine.reportEmitResults:invocation[0]";
"cleanupTask": "CLEAN" | "done.state.buildMachine.buildEntries" | "error.platform.buildMachine.emitEntries:invocation[0]";
"emitTask": "done.state.buildMachine.buildEntries";
"reportEmitResults": "done.invoke.buildMachine.emitEntries:invocation[0]";
        };
        matchesStates: "bootstrap" | "buildEntries" | "buildEntries.buildBundleEntries" | "buildEntries.buildBundleEntries.build" | "buildEntries.buildBundleEntries.failure" | "buildEntries.buildBundleEntries.success" | "buildEntries.buildFileEntries" | "buildEntries.buildFileEntries.build" | "buildEntries.buildFileEntries.failure" | "buildEntries.buildFileEntries.success" | "buildEntries.buildTypeEntries" | "buildEntries.buildTypeEntries.build" | "buildEntries.buildTypeEntries.failure" | "buildEntries.buildTypeEntries.success" | "chmodBinEntries" | "cleanup" | "cleanupFirst" | "done" | "emitEntries" | "reportEmitResults" | { "buildEntries"?: "buildBundleEntries" | "buildFileEntries" | "buildTypeEntries" | { "buildBundleEntries"?: "build" | "failure" | "success";
"buildFileEntries"?: "build" | "failure" | "success";
"buildTypeEntries"?: "build" | "failure" | "success"; }; };
        tags: never;
      }
