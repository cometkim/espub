// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]": {
      type: "done.invoke.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.buildMachine.buildEntries.buildFileEntries.build:invocation[0]": {
      type: "done.invoke.buildMachine.buildEntries.buildFileEntries.build:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]": {
      type: "done.invoke.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.buildMachine.emitEntries:invocation[0]": {
      type: "done.invoke.buildMachine.emitEntries:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]": {
      type: "error.platform.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]";
      data: unknown;
    };
    "error.platform.buildMachine.buildEntries.buildFileEntries.build:invocation[0]": {
      type: "error.platform.buildMachine.buildEntries.buildFileEntries.build:invocation[0]";
      data: unknown;
    };
    "error.platform.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]": {
      type: "error.platform.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]";
      data: unknown;
    };
    "error.platform.buildMachine.emitEntries:invocation[0]": {
      type: "error.platform.buildMachine.emitEntries:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    buildBundleTask: "done.invoke.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]";
    buildFileTask: "done.invoke.buildMachine.buildEntries.buildFileEntries.build:invocation[0]";
    buildTypeTask: "done.invoke.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]";
    emitTask: "done.invoke.buildMachine.emitEntries:invocation[0]";
  };
  missingImplementations: {
    actions:
      | "assignOutputFiles"
      | "assignBuildBundleErrors"
      | "assignBuildFileErrors"
      | "assignBuildTypeErrors"
      | "assignErrorCode"
      | "assignEmitErrors"
      | "reportResults"
      | "reportPerformance"
      | "reportErrors"
      | "cleanup";
    services:
      | "buildBundleTask"
      | "buildFileTask"
      | "buildTypeTask"
      | "emitTask";
    guards: "hasErrors";
    delays: never;
  };
  eventsCausingActions: {
    assignBuildBundleErrors: "error.platform.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]";
    assignBuildFileErrors: "error.platform.buildMachine.buildEntries.buildFileEntries.build:invocation[0]";
    assignBuildStartedAt: "BUILD";
    assignBuildTypeErrors: "error.platform.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]";
    assignBundleEntries: "BUILD";
    assignEmitErrors: "error.platform.buildMachine.emitEntries:invocation[0]";
    assignErrorCode: "error.platform.buildMachine.emitEntries:invocation[0]";
    assignFileEntries: "BUILD";
    assignOutputFiles:
      | "done.invoke.buildMachine.buildEntries.buildBundleEntries.build:invocation[0]"
      | "done.invoke.buildMachine.buildEntries.buildFileEntries.build:invocation[0]"
      | "done.invoke.buildMachine.buildEntries.buildTypeEntries.build:invocation[0]";
    assignTypeEntries: "BUILD";
    cleanup:
      | "done.state.buildMachine.buildEntries"
      | "error.platform.buildMachine.emitEntries:invocation[0]";
    reportErrors:
      | "done.state.buildMachine.buildEntries"
      | "error.platform.buildMachine.emitEntries:invocation[0]";
    reportPerformance: "done.invoke.buildMachine.emitEntries:invocation[0]";
    reportResults: "done.invoke.buildMachine.emitEntries:invocation[0]";
  };
  eventsCausingServices: {
    buildBundleTask: "BUILD";
    buildFileTask: "BUILD";
    buildTypeTask: "BUILD";
    emitTask: "done.state.buildMachine.buildEntries";
  };
  eventsCausingGuards: {
    hasErrors: "done.state.buildMachine.buildEntries";
  };
  eventsCausingDelays: {};
  matchesStates:
    | "bootstrap"
    | "buildEntries"
    | "buildEntries.buildBundleEntries"
    | "buildEntries.buildBundleEntries.build"
    | "buildEntries.buildBundleEntries.failure"
    | "buildEntries.buildBundleEntries.success"
    | "buildEntries.buildFileEntries"
    | "buildEntries.buildFileEntries.build"
    | "buildEntries.buildFileEntries.failure"
    | "buildEntries.buildFileEntries.success"
    | "buildEntries.buildTypeEntries"
    | "buildEntries.buildTypeEntries.build"
    | "buildEntries.buildTypeEntries.failure"
    | "buildEntries.buildTypeEntries.success"
    | "emitEntries"
    | "failure"
    | "success"
    | {
        buildEntries?:
          | "buildBundleEntries"
          | "buildFileEntries"
          | "buildTypeEntries"
          | {
              buildBundleEntries?: "build" | "failure" | "success";
              buildFileEntries?: "build" | "failure" | "success";
              buildTypeEntries?: "build" | "failure" | "success";
            };
      };
  tags: never;
}
