#!/usr/bin/env node

// src/bin.ts
import { parse as parseTsConfig } from "tsconfck";
import dedent10 from "string-dedent";

// src/cli.ts
import meow from "meow";
var cli = meow(`
Usage
  $ nanobundle <command> [options]

Available Commands
  build    Build once and exit
  clean    Remove outputs

Options
  --version            Display current version

  --cwd                Use an alternative working directory

  --clean              Clean outputs before build

  --tsconfig           Specify the path to a custom tsconfig.json

  --import-maps        Specify import map file path (default: package.json)

  --root-dir           Specify the path to resolve source entry (default: ./src)
                       This also can be configured by tsconfig.json

  --out-dir            Specify the path to resolve source entry (default: ./lib)
                       This also can be configured by tsconfig.json

  --platform           Specify bundle target platform (default: "netural")
                       One of "netural", "browser", "node" is allowed

  --standalone         Embed external dependencies into the bundle (default: false)

  --external           Specify external dependencies to exclude from the bundle

  --jsx                Specify JSX mode. One of "transform", "preserve", "automatic" is allowed
                       This also can be configured by tsconfig.json

  --jsx-factory        Specify JSX factory (default: "React.createElement")
                       This also can be configured by tsconfig.json

  --jsx-fragment       Specify JSX <Fragment> factory (default: "Fragment")
                       This also can be configured by tsconfig.json

  --jsx-import-source  Specify JSX import source (default: "react")
                       This also can be configured by tsconfig.json

  --no-sourcemap       Disable source map generation

  --no-bundle          Disable ESBuild bundle and other files build

  --no-dts             Disable TypeScript .d.ts build

  --verbose            Set to report build result more verbosely

  --help               Display this message
`, {
  importMeta: import.meta,
  flags: {
    cwd: {
      type: "string",
      default: process.cwd()
    },
    clean: {
      type: "boolean",
      default: false
    },
    rootDir: {
      type: "string"
    },
    outDir: {
      type: "string"
    },
    tsconfig: {
      type: "string",
      default: "tsconfig.json"
    },
    importMaps: {
      type: "string",
      default: "package.json"
    },
    external: {
      type: "string",
      isMultiple: true,
      default: []
    },
    platform: {
      type: "string"
    },
    standalone: {
      type: "boolean",
      default: false
    },
    sourcemap: {
      type: "boolean"
    },
    bundle: {
      type: "boolean",
      default: true
    },
    dts: {
      type: "boolean",
      default: true
    },
    jsx: {
      type: "string"
    },
    jsxFactory: {
      type: "string"
    },
    jsxFragment: {
      type: "string"
    },
    jsxImportSource: {
      type: "string"
    },
    verbose: {
      type: "boolean",
      default: false
    }
  }
});

// src/reporter.ts
import { formatWithOptions as formatWithOptions2 } from "node:util";
import kleur2 from "kleur";

// src/formatUtils.ts
import { formatWithOptions } from "node:util";
import kleur from "kleur";
var { FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env;
var isTTY = process.stdout.isTTY;
var colorEnabled = !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== "dumb" && (FORCE_COLOR != null && FORCE_COLOR !== "0" || isTTY);
function indent(msg, level) {
  const tab = "  ";
  const padding = tab.repeat(level);
  return msg.split("\n").map((msg2) => `${padding}${msg2}`).join("\n");
}
function format(msg, ...args) {
  return formatWithOptions({ colors: colorEnabled }, msg, ...args);
}
function hyperlink(hyperlink2) {
  return kleur.underline().cyan(hyperlink2);
}
function path(path9) {
  return kleur.underline().cyan(path9);
}
function literal(literal2) {
  if (literal2 === null || literal2 === void 0) {
    return kleur.bold().green(`${literal2}`);
  }
  if (typeof literal2 === "string") {
    return kleur.green(`'${literal2}'`);
  }
  if (typeof literal2 !== "object") {
    return kleur.green(`${literal2}`);
  }
  return object(literal2);
}
function key(text) {
  return kleur.bold().blue(`"${text}"`);
}
function object(object2) {
  const formatted = formatWithOptions({ colors: colorEnabled }, "%o", object2);
  return kleur.white(formatted);
}
function command(command3) {
  return kleur.bold().blue(`\`${command3}\``);
}
function highlight(text) {
  return kleur.bold().cyan(text);
}

// src/errors.ts
var NanobundleError = class extends Error {
};
var NanobundleConfigError = class extends NanobundleError {
};

// src/reporter.ts
var ConsoleReporter = class {
  #level;
  #console;
  color = colorEnabled;
  level = "debug";
  constructor(console2, level = 0) {
    this.#level = level;
    this.#console = console2;
  }
  #indent(msg) {
    return indent(msg, this.#level);
  }
  debug(msg, ...args) {
    if (this.level !== "debug") {
      return;
    }
    const formatted = formatWithOptions2(
      { colors: this.color },
      msg,
      ...args
    );
    const indented = this.#indent(formatted);
    this.#console.debug(
      kleur2.gray(`[debug] ${indented}`)
    );
  }
  info(msg, ...args) {
    const formatted = formatWithOptions2(
      { colors: this.color },
      msg,
      ...args
    );
    const indented = this.#indent(formatted);
    this.#console.info(
      kleur2.white(`[info] ${indented}`)
    );
  }
  warn(msg, ...args) {
    const formatted = formatWithOptions2(
      { colors: this.color },
      msg,
      ...args
    );
    const indented = this.#indent(formatted);
    this.#console.warn(
      kleur2.yellow(`[warn] ${indented}`)
    );
  }
  error(msg, ...args) {
    const formatted = formatWithOptions2(
      { colors: this.color },
      msg,
      ...args
    );
    const indented = this.#indent(formatted);
    this.#console.error(
      kleur2.red(`[error] ${indented}`)
    );
  }
  captureException(exn) {
    let formatted;
    if (exn instanceof NanobundleError && exn.message) {
      formatted = exn.message;
    } else if (exn instanceof Error) {
      formatted = formatWithOptions2(
        { colors: this.color },
        exn.stack
      );
    } else {
      formatted = formatWithOptions2(
        { colors: this.color },
        "%s",
        exn
      );
    }
    const indented = this.#indent(formatted);
    this.#console.error(
      kleur2.bold().red(`${indented}`)
    );
  }
  createChildReporter() {
    const child = new ConsoleReporter(this.#console, this.#level + 1);
    child.color = this.color;
    return child;
  }
};

// src/target.ts
import browserslist from "browserslist";
var browsersToTargets = {
  "chrome": "chrome",
  "firefox": "firefox",
  "safari": "safari",
  "edge": "edge",
  "node": "node",
  "ios_saf": "ios",
  "android": "chrome",
  "and_chr": "chrome",
  "and_ff": "firefox",
  // FIXME: better compat mode
  "deno": "chrome"
};
var supportedBrowsers = new Set(Object.keys(browsersToTargets));
function isSupportedBrowser(browser) {
  return supportedBrowsers.has(browser);
}
async function loadTargets(options) {
  const queries = browserslist(options.query, {
    path: options.basePath
  });
  const targetVersions = /* @__PURE__ */ new Map();
  for (const query of queries) {
    const [browser, versionString] = query.split(" ");
    if (!isSupportedBrowser(browser)) {
      continue;
    }
    let target = browsersToTargets[browser];
    let minVersion2 = +versionString.split("-")[0];
    if (browser === "android") {
      if (minVersion2 > 4.4) {
        target = "chrome";
        minVersion2 = 96;
      } else {
        continue;
      }
    }
    const targetVersion = targetVersions.get(target);
    if (!targetVersion || targetVersion > minVersion2) {
      targetVersions.set(target, minVersion2);
    }
  }
  return Array.from(targetVersions.entries()).map((targetVersion) => targetVersion.join(""));
}

// src/manifest.ts
import * as path2 from "node:path";
import * as fs from "node:fs/promises";
var loadManifest = async ({
  basePath
}) => {
  const configPath = path2.resolve(basePath, "package.json");
  const { publishConfig, ...config } = await fs.readFile(configPath, "utf-8").then(JSON.parse);
  return {
    ...config,
    ...publishConfig
  };
};

// src/context.ts
import * as path3 from "node:path";
import dedent from "string-dedent";
import * as semver from "semver";
var NanobundleConfigError2 = class extends NanobundleError {
  name = "NanobundleConfigError";
};
function parseConfig({
  flags: flags2,
  manifest,
  targets: inputTargets,
  reporter: reporter2,
  tsconfig,
  tsconfigPath: resolvedTsConfigPath
}) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const cwd = path3.resolve(flags2.cwd);
  const resolvePath = (...paths) => path3.resolve(cwd, ...paths);
  const resolveRelativePath = (targetPath, startsWithDot = false) => {
    const relativePath = path3.relative(cwd, targetPath);
    if (startsWithDot)
      return `./${relativePath}`;
    return relativePath;
  };
  const bundle = flags2.bundle;
  const verbose = flags2.verbose;
  const standalone = flags2.standalone;
  const tsconfigPath = resolvedTsConfigPath;
  const importMapsPath = path3.resolve(cwd, flags2.importMaps);
  const forceExternalDependencies = flags2.external;
  const externalDependencies = [
    ...manifest.dependencies ? Object.keys(manifest.dependencies) : [],
    ...manifest.peerDependencies ? Object.keys(manifest.peerDependencies) : [],
    ...forceExternalDependencies
  ];
  const rootDir = flags2.rootDir || ((_a = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _a.rootDir) || "src";
  const outDir = flags2.outDir || ((_b = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _b.outDir) || "lib";
  const module = manifest.type === "module" ? "esmodule" : "commonjs";
  let sourcemap = true;
  if (((_c = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _c.sourceMap) != null) {
    sourcemap = tsconfig.compilerOptions.sourceMap;
  }
  if (flags2.sourcemap != null) {
    sourcemap = flags2.sourcemap;
  }
  let platform = "neutral";
  if (["node", "deno", "web"].includes(flags2.platform || "")) {
    platform = flags2.platform;
  } else if ((_d = manifest.engines) == null ? void 0 : _d.node) {
    platform = "node";
  }
  let targets = [...inputTargets];
  if ((_e = manifest.engines) == null ? void 0 : _e.node) {
    const version = semver.minVersion(manifest.engines.node);
    if (version) {
      targets = [...targets, `node${version.major}`];
    }
  }
  if (platform === "node" && !targets.some((target) => target.startsWith("node"))) {
    targets = [...targets, "node14"];
  }
  if (platform === "node") {
    targets = targets.filter((target) => target.startsWith("node"));
  }
  if (platform === "browser") {
    targets = targets.filter((target) => !target.startsWith("node"));
  }
  let declaration = false;
  if (flags2.dts && tsconfig) {
    declaration = ((_f = tsconfig.compilerOptions) == null ? void 0 : _f.declaration) !== false;
  }
  if (!declaration && rootDir === outDir) {
    throw new NanobundleConfigError2(dedent`
      ${key("rootDir")} (${path(rootDir)}) and ${key("outDir")} (${path(outDir)}) are conflict!

      Please specify different directory for one of them.
    `);
  }
  let jsx = void 0;
  if (((_g = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _g.jsx) === "preserve") {
    jsx = "preserve";
  }
  if (["react", "react-native"].includes((_h = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _h.jsx)) {
    jsx = "transform";
  }
  if (["react-jsx", "react-jsxdev"].includes((_i = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _i.jsx)) {
    jsx = "automatic";
  }
  if (flags2.jsx === "preserve") {
    jsx = "preserve";
  }
  if (flags2.jsx === "transform") {
    jsx = "transform";
  }
  if (flags2.jsx === "automatic") {
    jsx = "automatic";
  }
  let jsxDev = false;
  if (!flags2.jsx && ((_j = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _j.jsx) === "react-jsxdev") {
    jsxDev = true;
  }
  const jsxFactory = flags2.jsxFactory || ((_k = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _k.jsxFactory) || "React.createElement";
  const jsxFragment = flags2.jsxFragment || ((_l = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _l.jsxFragmentFactory) || "Fragment";
  const jsxImportSource = flags2.jsxImportSource || ((_m = tsconfig == null ? void 0 : tsconfig.compilerOptions) == null ? void 0 : _m.jsxImportSource) || "react";
  return {
    cwd,
    verbose,
    module,
    platform,
    sourcemap,
    bundle,
    declaration,
    jsx,
    jsxDev,
    jsxFactory,
    jsxFragment,
    jsxImportSource,
    standalone,
    rootDir,
    outDir,
    tsconfigPath,
    importMapsPath,
    externalDependencies,
    forceExternalDependencies,
    manifest,
    targets,
    reporter: reporter2,
    resolvePath,
    resolveRelativePath
  };
}

// src/entry.ts
import * as path4 from "node:path";
import dedent2 from "string-dedent";
import kleur3 from "kleur";
var getEntriesFromContext = ({
  context,
  reporter: reporter2
}) => {
  const defaultMinify = false;
  const defaultMode = void 0;
  const {
    cwd,
    rootDir,
    outDir,
    sourcemap,
    manifest,
    tsconfigPath,
    jsx,
    platform: defaultPlatform,
    module: defaultModule
  } = context;
  const defaultPreferredModule = {
    commonjs: "commonjs",
    esmodule: "esmodule",
    dts: void 0,
    file: void 0
  }[defaultModule];
  const resolvedRootDir = context.resolvePath(rootDir);
  const resolvedOutDir = context.resolvePath(outDir);
  const useJsx = jsx != null;
  const useTsSource = tsconfigPath != null;
  const useJsSource = !(useTsSource && resolvedRootDir === resolvedOutDir);
  const preserveJsx = context.jsx === "preserve";
  const entryMap = /* @__PURE__ */ new Map();
  function addEntry(target) {
    var _a;
    const {
      key: key2,
      parentKey,
      sourcemap: sourcemap2,
      entryPath,
      platform,
      module,
      mode,
      preferredModule,
      customConditions
    } = target;
    if (!entryPath.startsWith("./")) {
      throw new NanobundleEntryError(
        Message.INVALID_PATH_KEY(key2)
      );
    }
    if (entryPath.includes("*")) {
      throw new NanobundleEntryError(
        Message.SUBPATH_PATTERN(entryPath)
      );
    }
    if (module === "dts" && !/\.d\.(c|m)?ts$/.test(entryPath)) {
      throw new NanobundleEntryError(
        Message.INVALID_DTS_FORMAT()
      );
    }
    const entry = entryMap.get(entryPath);
    if (entry) {
      if (entry.key.startsWith("exports") && !key2.startsWith("exports")) {
        if (entry.platform !== platform || entry.module !== module) {
          reporter2.warn(
            Message.PRECEDENSE_ENTRY(entry, target)
          );
        }
        return;
      }
      if (entry.platform !== platform || entry.module !== module) {
        let hint = "";
        if (entry.key === "main" && key2 === "module" || entry.key === "module" && key2 === "main") {
          hint = dedent2`
            Did you forgot to set ${key("type")} to ${literal("module")} for ESM-first approach?
          `;
        }
        if (entry.module === module && entry.platform !== platform) {
          hint = dedent2`
            Did you forget to specify the Node.js version in the ${key("engines")} field?
            Or you may not need to specify ${key("require")} or ${key("node")} entries.
          `;
        }
        throw new NanobundleEntryError(
          Message.CONFLICT_ENTRY(entry, target, hint)
        );
      }
      return;
    }
    const sourceFileCandidates = /* @__PURE__ */ new Set();
    const resolvedOutputFile = context.resolvePath(entryPath);
    let resolvedSourceFile = resolvedOutputFile.replace(
      resolvedOutDir,
      resolvedRootDir
    );
    const minifyPattern = /\.min(?<ext>\.(m|c)?jsx?)$/;
    const minifyMatch = resolvedSourceFile.match(minifyPattern);
    const minify = defaultMinify || Boolean(minifyMatch);
    const ext = (_a = minifyMatch == null ? void 0 : minifyMatch.groups) == null ? void 0 : _a.ext;
    if (ext) {
      resolvedSourceFile = resolvedSourceFile.replace(minifyPattern, ext);
    }
    if (!/jsx?$/.test(resolvedSourceFile)) {
      switch (module) {
        case "commonjs": {
          useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.cts`);
          useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.cjs`);
          useJsx && useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.tsx`);
          useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.ts`);
          useJsx && useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.jsx`);
          useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.js`);
          break;
        }
        case "esmodule": {
          useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.mts`);
          useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.mjs`);
          useJsx && useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.tsx`);
          useTsSource && sourceFileCandidates.add(`${resolvedSourceFile}.ts`);
          useJsx && useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.jsx`);
          useJsSource && sourceFileCandidates.add(`${resolvedSourceFile}.js`);
          break;
        }
      }
    }
    switch (module) {
      case "commonjs": {
        useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?jsx?$/, ".cts"));
        useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?jsx?$/, ".cjs"));
        useJsx && useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?jsx?$/, ".tsx"));
        useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?jsx?$/, ".ts"));
        useJsx && useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?jsx?$/, ".jsx"));
        useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.c?jsx?$/, ".js"));
        if (parentKey) {
          let resolvedSourceFileWithoutCondition = resolvedSourceFile.replace("." + parentKey, "");
          useTsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.c?jsx?$/, ".cts"));
          useJsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.c?jsx?$/, ".cjs"));
          useJsx && useTsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.c?jsx?$/, ".tsx"));
          useTsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.c?jsx?$/, ".ts"));
          useJsx && useJsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.c?jsx?$/, ".jsx"));
          useJsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.c?jsx?$/, ".js"));
        }
        break;
      }
      case "esmodule": {
        useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?jsx?$/, ".mts"));
        useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?jsx?$/, ".mjs"));
        useJsx && useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?jsx?$/, ".tsx"));
        useTsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?jsx?$/, ".ts"));
        useJsx && useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?jsx?$/, ".jsx"));
        useJsSource && sourceFileCandidates.add(resolvedSourceFile.replace(/\.m?jsx?$/, ".js"));
        if (parentKey) {
          let resolvedSourceFileWithoutCondition = resolvedSourceFile.replace("." + parentKey, "");
          useTsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.m?jsx?$/, ".mts"));
          useJsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.m?jsx?$/, ".mjs"));
          useJsx && useTsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.m?jsx?$/, ".tsx"));
          useTsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.m?jsx?$/, ".ts"));
          useJsx && useJsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.m?jsx?$/, ".jsx"));
          useJsSource && sourceFileCandidates.add(resolvedSourceFileWithoutCondition.replace(/\.m?jsx?$/, ".js"));
        }
        break;
      }
      case "dts": {
        if (!useTsSource)
          break;
        if (preferredModule === "commonjs") {
          sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.c?ts$/, ".cts"));
        }
        if (preferredModule === "esmodule") {
          sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.m?ts$/, ".mts"));
        }
        useJsx && sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.(m|c)?ts$/, ".tsx"));
        sourceFileCandidates.add(resolvedSourceFile.replace(/\.d\.(m|c)?ts$/, ".ts"));
        break;
      }
    }
    switch (module) {
      case "commonjs":
      case "esmodule": {
        useJsSource && sourceFileCandidates.add(resolvedSourceFile);
        break;
      }
      case "file": {
        if (path4.relative(cwd, path4.dirname(resolvedOutputFile))) {
          sourceFileCandidates.add(resolvedSourceFile);
        } else {
          sourceFileCandidates.add(resolvedOutputFile);
        }
        break;
      }
    }
    const sourceFile = [...sourceFileCandidates];
    if (useJsx) {
      sourceFile.sort((a, b) => {
        if (a.endsWith("x") && b.endsWith("x")) {
          return 0;
        } else if (a.endsWith("x")) {
          return -1;
        } else {
          return 1;
        }
      });
    }
    entryMap.set(entryPath, {
      key: key2,
      entryPath,
      mode,
      minify,
      sourcemap: sourcemap2,
      platform,
      module,
      sourceFile,
      outputFile: resolvedOutputFile,
      customConditions
    });
  }
  function addMainEntry({
    key: key2,
    entryPath
  }) {
    const ext = path4.extname(entryPath);
    switch (ext) {
      case ".cjs": {
        addEntry({
          key: key2,
          sourcemap,
          platform: defaultPlatform,
          mode: defaultMode,
          module: "commonjs",
          preferredModule: "commonjs",
          entryPath,
          customConditions: []
        });
        break;
      }
      case ".mjs": {
        addEntry({
          key: key2,
          sourcemap,
          platform: defaultPlatform,
          mode: defaultMode,
          module: "esmodule",
          preferredModule: "esmodule",
          entryPath,
          customConditions: []
        });
        break;
      }
      case ".node": {
        addEntry({
          key: key2,
          sourcemap,
          platform: "node",
          mode: defaultMode,
          module: "file",
          entryPath,
          customConditions: []
        });
        break;
      }
      case ".json": {
        addEntry({
          key: key2,
          sourcemap,
          platform: defaultPlatform,
          mode: defaultMode,
          module: "file",
          entryPath,
          customConditions: []
        });
        break;
      }
      case ".jsx": {
        if (!preserveJsx) {
          reporter2.warn(Message.NO_NEED_JSX(entryPath));
        }
      }
      default: {
        addEntry({
          key: key2,
          sourcemap,
          platform: defaultPlatform,
          mode: defaultMode,
          module: defaultModule,
          entryPath,
          customConditions: []
        });
        break;
      }
    }
  }
  function addModuleEntry({
    key: key2,
    entryPath
  }) {
    if (/\.m?jsx?$/.test(entryPath)) {
      addEntry({
        key: key2,
        sourcemap,
        platform: defaultPlatform,
        mode: defaultMode,
        module: "esmodule",
        preferredModule: "esmodule",
        entryPath,
        customConditions: []
      });
    } else {
      throw new NanobundleEntryError(Message.INVALID_MODULE_EXTENSION());
    }
  }
  function addTypesEntry({
    key: key2,
    entryPath
  }) {
    if (/\.d\.(m|c)?ts$/.test(entryPath)) {
      addEntry({
        key: key2,
        sourcemap,
        platform: defaultPlatform,
        mode: defaultMode,
        module: "dts",
        preferredModule: defaultPreferredModule,
        entryPath,
        customConditions: []
      });
    } else {
      throw new NanobundleEntryError(Message.INVALID_TYPES_EXTENSION());
    }
  }
  function addBinEntry({
    key: key2,
    entryPath
  }) {
    const ext = path4.extname(entryPath);
    switch (ext) {
      case ".js": {
        addEntry({
          key: key2,
          sourcemap: false,
          platform: "node",
          mode: defaultMode,
          module: defaultModule,
          preferredModule: defaultPreferredModule,
          entryPath,
          customConditions: []
        });
        break;
      }
      case ".cjs": {
        addEntry({
          key: key2,
          sourcemap: false,
          platform: "node",
          mode: defaultMode,
          module: "commonjs",
          preferredModule: defaultPreferredModule,
          entryPath,
          customConditions: []
        });
        break;
      }
      case ".mjs": {
        addEntry({
          key: key2,
          sourcemap: false,
          platform: "node",
          mode: defaultMode,
          module: "esmodule",
          preferredModule: defaultPreferredModule,
          entryPath,
          customConditions: []
        });
        break;
      }
      default: {
        throw new NanobundleEntryError(Message.INVALID_BIN_EXTENSION());
      }
    }
  }
  function addConditionalEntry({
    key: key2,
    parentKey,
    platform,
    mode,
    module,
    preferredModule,
    entryPath,
    customConditions
  }) {
    if (typeof entryPath === "string") {
      if (parentKey === "types") {
        addEntry({
          key: key2,
          parentKey,
          sourcemap,
          platform,
          mode,
          module: "dts",
          preferredModule,
          entryPath,
          customConditions
        });
        return;
      }
      const ext = path4.extname(entryPath);
      switch (ext) {
        case ".cjs": {
          addEntry({
            key: key2,
            parentKey,
            sourcemap,
            platform,
            mode,
            module: "commonjs",
            preferredModule: "commonjs",
            entryPath,
            customConditions
          });
          break;
        }
        case ".mjs": {
          addEntry({
            key: key2,
            parentKey,
            sourcemap,
            platform,
            mode,
            module: "esmodule",
            preferredModule: "esmodule",
            entryPath,
            customConditions
          });
          break;
        }
        case ".node": {
          addEntry({
            key: key2,
            parentKey,
            sourcemap,
            platform: "node",
            mode,
            module: "file",
            preferredModule,
            entryPath,
            customConditions
          });
          break;
        }
        case ".json": {
          addEntry({
            key: key2,
            parentKey,
            sourcemap,
            platform,
            mode,
            module: "file",
            preferredModule,
            entryPath,
            customConditions
          });
          break;
        }
        case ".jsx": {
          if (!preserveJsx) {
            reporter2.warn(Message.NO_NEED_JSX(entryPath));
          }
        }
        default: {
          addEntry({
            key: key2,
            parentKey,
            sourcemap,
            platform,
            mode,
            module,
            preferredModule,
            entryPath,
            customConditions
          });
          break;
        }
      }
    } else if (typeof entryPath === "object") {
      if (parentKey === "types") {
        throw new NanobundleEntryError(Message.INVALID_DTS_FORMAT());
      }
      let entries2 = Object.entries(entryPath);
      if (typeof entryPath.types !== "undefined") {
        const typesEntryIndex = entries2.findIndex((entry) => entry[0] === "types");
        if (typesEntryIndex !== 0) {
          throw new NanobundleEntryError(Message.INVALID_DTS_ORDER());
        }
      } else {
        const firstLeaf = entries2.find(([entryKey, entry]) => {
          return typeof entry === "string" && !entryKey.startsWith(".");
        });
        const isLeaf = firstLeaf !== void 0;
        if (useTsSource && isLeaf) {
          if (typeof entryPath.default === "string") {
            const dtsExport = [
              "types$implicit",
              inferDtsEntry(entryPath.default)
            ];
            entries2 = [dtsExport, ...entries2];
          } else if (typeof entryPath.require === "string" && typeof entryPath.import === "string") {
            throw new NanobundleEntryError(
              Message.UNDETEMINED_DTS_SOURCE(key2, entryPath.require, entryPath.import)
            );
          } else if (typeof entryPath.require === "string") {
            const dtsExport = [
              "types$implicit",
              inferDtsEntry(entryPath.require)
            ];
            entries2 = [dtsExport, ...entries2];
          } else if (typeof entryPath.import === "string") {
            const dtsExport = [
              "types$implicit",
              inferDtsEntry(entryPath.import)
            ];
            entries2 = [dtsExport, ...entries2];
          } else if (preferredModule) {
            const dtsExport = [
              "types$implicit",
              inferDtsEntry(firstLeaf[1])
            ];
            entries2 = [dtsExport, ...entries2];
          } else {
            reporter2.warn(Message.TYPES_MAY_NOT_BE_RESOLVED(key2));
          }
        }
      }
      for (const [currentKey, output] of entries2) {
        switch (currentKey) {
          case "import": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode,
              module: "esmodule",
              preferredModule: "esmodule",
              entryPath: output,
              customConditions
            });
            break;
          }
          case "require": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode,
              module: "commonjs",
              preferredModule: "commonjs",
              entryPath: output,
              customConditions
            });
            break;
          }
          case "types": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode,
              module: "dts",
              preferredModule: void 0,
              entryPath: output,
              customConditions
            });
            break;
          }
          case "types$implicit": {
            addConditionalEntry({
              key: `${key2}.types`,
              parentKey: currentKey,
              platform,
              mode,
              module: "dts",
              preferredModule,
              entryPath: output,
              customConditions
            });
            break;
          }
          case "node": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform: "node",
              mode,
              module,
              preferredModule,
              entryPath: output,
              customConditions
            });
            break;
          }
          case "deno": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform: "deno",
              mode,
              module,
              preferredModule,
              entryPath: output,
              customConditions
            });
            break;
          }
          case "browser": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform: "browser",
              mode,
              module,
              preferredModule,
              entryPath: output,
              customConditions
            });
            break;
          }
          case "development": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode: "development",
              module,
              preferredModule,
              entryPath: output,
              customConditions
            });
            break;
          }
          case "production": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode: "production",
              module,
              preferredModule,
              entryPath: output,
              customConditions
            });
            break;
          }
          case "default": {
            addConditionalEntry({
              key: `${key2}.${currentKey}`,
              parentKey: currentKey,
              platform,
              mode,
              module,
              preferredModule,
              entryPath: output,
              customConditions
            });
            break;
          }
          case ".": {
            addConditionalEntry({
              key: `${key2}["${currentKey}"]`,
              parentKey: currentKey,
              platform,
              mode,
              module,
              preferredModule,
              entryPath: output,
              customConditions
            });
            break;
          }
          default: {
            if (currentKey.startsWith("./")) {
              addConditionalEntry({
                key: `${key2}["${currentKey}"]`,
                parentKey: currentKey,
                platform,
                mode,
                module,
                preferredModule,
                entryPath: output,
                customConditions
              });
            } else {
              reporter2.warn(Message.CUSTOM_CONDITION(currentKey));
              addConditionalEntry({
                key: `${key2}.${currentKey}`,
                parentKey: currentKey,
                platform,
                mode,
                module,
                preferredModule,
                entryPath: output,
                customConditions: [.../* @__PURE__ */ new Set([...customConditions, currentKey])]
              });
            }
            break;
          }
        }
      }
    }
  }
  if (manifest.exports) {
    addConditionalEntry({
      key: "exports",
      parentKey: "exports",
      platform: defaultPlatform,
      mode: defaultMode,
      module: defaultModule,
      preferredModule: defaultPreferredModule,
      entryPath: manifest.exports,
      customConditions: []
    });
  } else if (manifest.main || manifest.module) {
    reporter2.warn(Message.RECOMMEND_EXPORTS());
  }
  if (typeof manifest.main === "string") {
    addMainEntry({
      key: "main",
      entryPath: manifest.main
    });
  }
  if (typeof manifest.module === "string") {
    addModuleEntry({
      key: "module",
      entryPath: manifest.module
    });
    reporter2.warn(Message.MODULE_NOT_RECOMMENDED());
  }
  if (typeof manifest.types === "string") {
    addTypesEntry({
      key: "types",
      entryPath: manifest.types
    });
  }
  if (typeof manifest.bin === "string") {
    addBinEntry({
      key: "bin",
      entryPath: manifest.bin
    });
  }
  if (typeof manifest.bin === "object") {
    for (const [commandName, entryPath] of Object.entries(manifest.bin)) {
      addBinEntry({
        key: `bin["${commandName}"]`,
        entryPath
      });
    }
  }
  const entries = [...entryMap.values()];
  return entries;
};
function inferDtsEntry(entryPath) {
  return entryPath.replace(/(\.min)?\.(m|c)?jsx?$/, ".d.$2ts");
}
var NanobundleEntryError = class extends NanobundleError {
};
var Message = {
  INVALID_MODULE_EXTENSION: () => dedent2`
    Only ${path(".js")} or ${path(".mjs")} allowed for ${key("module")} entry.

  `,
  INVALID_TYPES_EXTENSION: () => dedent2`
    Only ${path(".d.ts")} or ${path(".d.cts")} or ${path(".d.mts")} allowed for ${key("types")} entry.

  `,
  INVALID_BIN_EXTENSION: () => dedent2`
    Only JavaScript files are allowed for ${path("bin")} entry.

  `,
  INVALID_PATH_KEY: (path9) => dedent2`
    Invalid entry path ${path(path9)}, entry path should starts with ${literal("./")}.

  `,
  INVALID_DTS_FORMAT: () => dedent2`
    ${key("types")} entry must be .d.ts file and cannot be nested!

  `,
  INVALID_DTS_ORDER: () => dedent2`
    ${key("types")} entry must occur first in conditional exports for correct type resolution.

  `,
  UNDETEMINED_DTS_SOURCE: (key2, requirePath, importPath) => dedent2`
    ${key("types")} entry doesn't set properly for ${key(key2)}:

        "require": "${requirePath}",
        "import": "${importPath}"

    Solution 1. Explicitly set ${key("types")} entry
      
      For example like this

      + "types": "${requirePath.replace(/\.(m|c)?js$/, ".d.ts")}",
        "require": "${requirePath}",
        "import": "${importPath}"

      Or like this

        "require": {
      +   "types": "${requirePath.replace(/\.(m|c)?js$/, ".d.$1ts")}",
          "default": "${requirePath}"
        },
        "import": {
      +   "types": "${importPath.replace(/\.(m|c)?js$/, ".d.$1ts")}",
          "default": "${importPath}"
        }

    Solution 2. Add ${key("default")} entry

        "require": "${requirePath}",
        "import": "${importPath}",
      + "default": "/path/to/entry.js"

  `,
  SUBPATH_PATTERN: (path9) => dedent2`
    Subpath pattern (${path(path9)}) is not supported yet.

  `,
  CONFLICT_ENTRY: (a, b, hint) => format(
    dedent2`
      Conflict found for ${path(a.entryPath)}

          %s
          %s

        vs

          %s ${kleur3.bold("(conflited)")}
          %s

    `,
    key(a.key),
    object({ module: a.module, platform: a.platform }),
    key(b.key),
    object({ module: b.module, platform: b.platform })
  ) + hint ? `Hint: ${hint}

` : "",
  PRECEDENSE_ENTRY: (a, b) => format(
    dedent2`
      Entry ${key(b.key)} will be ignored since

          %s
          %s

        precedense over

          %s ${kleur3.bold("(ignored)")}
          %s

    `,
    key(a.key),
    object({ module: a.module, platform: a.platform }),
    key(b.key),
    object({ module: b.module, platform: b.platform })
  ),
  RECOMMEND_EXPORTS: () => dedent2`
    Using ${key("exports")} field is highly recommended.

      See ${hyperlink("https://nodejs.org/api/packages.html")} for more detail.

  `,
  MODULE_NOT_RECOMMENDED: () => dedent2`
    ${key("module")} field is not standard and may works in only legacy bundlers. Consider using ${key("exports")} instead.
      See ${hyperlink("https://nodejs.org/api/packages.html")} for more detail.

  `,
  TYPES_MAY_NOT_BE_RESOLVED: (key2) => dedent2`
    ${key(key2)} entry might not be resolved correctly in ${key("moduleResolution")}: ${literal("Node16")}.

    Consider to specify ${key("types")} entry for it.

  `,
  NO_NEED_JSX: (path9) => dedent2`
    ${path(path9)} doesn't have to be \`.jsx\` unless you are using ${key("preserve")} mode.
  `,
  CUSTOM_CONDITION: (condition) => dedent2`
    Custom condition ${key(condition)} may has no effects.
  `
};

// src/commands/build/index.ts
import dedent8 from "string-dedent";
import { performance as performance2 } from "node:perf_hooks";
import { interpret } from "xstate";

// src/commands/build/build.machine.ts
import { performance } from "node:perf_hooks";
import dedent7 from "string-dedent";
import { assign, createMachine } from "xstate";

// src/entryGroup.ts
function filterBundleEntry(entry) {
  return entry.module === "esmodule" || entry.module === "commonjs";
}
function filterTypeEntry(entry) {
  return entry.module === "dts";
}
function filterFileEntry(entry) {
  return entry.module === "file";
}
function hashBundleOptions(options) {
  const normalized = {
    mode: options.mode,
    module: options.module,
    minify: options.minify,
    platform: options.platform,
    sourcemap: options.sourcemap,
    customConditions: [...options.customConditions].sort()
  };
  return JSON.stringify(normalized);
}
function optionsFromHash(hash) {
  return JSON.parse(hash);
}
function extractBundleOptions(entry) {
  const options = {
    mode: entry.mode,
    module: entry.module,
    minify: entry.minify,
    platform: entry.platform,
    sourcemap: entry.sourcemap,
    customConditions: entry.customConditions
  };
  return options;
}
function groupBundleEntries(entries) {
  const group = {};
  for (const entry of entries) {
    const options = extractBundleOptions(entry);
    const optionsHash = hashBundleOptions(options);
    if (group[optionsHash]) {
      group[optionsHash].push(entry);
    } else {
      group[optionsHash] = [entry];
    }
  }
  return group;
}

// src/tasks/buildBundleTask.ts
import * as path7 from "node:path";
import * as esbuild from "esbuild";
import dedent3 from "string-dedent";

// src/fsUtils.ts
import * as fs2 from "node:fs";
function exists(path9) {
  return fs2.promises.access(path9, fs2.constants.F_OK).then(() => true).catch(() => false);
}
async function chooseExist(paths) {
  let result = null;
  for (const candidate of paths) {
    if (await exists(candidate)) {
      result = candidate;
      break;
    }
  }
  return result;
}
function isFileSystemReference(path9) {
  const fileSystemReferencePattern = /^(\.{0,2}\/).*/;
  return fileSystemReferencePattern.test(path9);
}

// src/importMaps.ts
import * as path5 from "node:path";
import * as fs3 from "node:fs/promises";
var importSubpathPattern = /^(?<dirname>.+\/)(?<filename>(?<base>[^\/]+?)(?<ext>\.[^\.]+)?)$/;
async function loadImportMaps(context) {
  const { imports = {} } = await fs3.readFile(context.importMapsPath, "utf-8").then(JSON.parse);
  return { imports };
}
async function validateImportMaps({
  context,
  importMaps,
  rootKey
}) {
  for (const [key2, importPath] of Object.entries(importMaps.imports)) {
    if (typeof importPath === "object") {
      await validateImportMaps({
        context,
        importMaps: {
          imports: importPath
        },
        rootKey: rootKey || key2
      });
    } else {
      if (!(rootKey || key2).startsWith("#")) {
        if (key2.endsWith("/") || key2.includes("*") || importPath.endsWith("/") || importPath.includes("*")) {
          throw new NanobundleConfigError(
            "Directory or subpath pattern imports is supported only for Node.js-style imports like #pattern"
          );
        }
      }
      if (!isFileSystemReference(importPath)) {
        continue;
      }
      const resolvedPath = path5.resolve(
        path5.dirname(context.importMapsPath),
        importPath.includes("*") ? path5.dirname(importPath) : importPath
      );
      const exist = await exists(resolvedPath);
      if (!exist) {
        throw new NanobundleConfigError(`${path(resolvedPath)} doesn't exist`);
      }
    }
  }
  return importMaps;
}
function normalizeImportMaps(importMaps, bundleOptions) {
  function normalize(rootKey, imports, mode2, module2, platform2, customConditions2) {
    if (typeof imports === "string") {
      return imports;
    } else {
      for (const [key2, value] of Object.entries(imports)) {
        if (key2 === "node" && platform2 === "node") {
          if (typeof value === "string") {
            return value;
          } else {
            return normalize(
              rootKey,
              value,
              mode2,
              module2,
              "node",
              customConditions2
            );
          }
        }
        if (key2 === "browser" && platform2 === "browser") {
          if (typeof value === "string") {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode2,
              module2,
              "browser",
              customConditions2
            );
          }
        }
        if (key2 === "require" && module2 === "commonjs") {
          if (typeof value === "string") {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode2,
              "commonjs",
              platform2,
              customConditions2
            );
          }
        }
        if (key2 === "import" && module2 === "esmodule") {
          if (typeof value === "string") {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode2,
              "esmodule",
              platform2,
              customConditions2
            );
          }
        }
        if (key2 === "development" && mode2 === "development") {
          if (typeof value === "string") {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              "development",
              module2,
              platform2,
              customConditions2
            );
          }
        }
        if (key2 === "production" && mode2 === "production") {
          if (typeof value === "string") {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              "production",
              module2,
              platform2,
              customConditions2
            );
          }
        }
        if (customConditions2.includes(key2)) {
          if (typeof value === "string") {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode2,
              module2,
              platform2,
              customConditions2
            );
          }
        }
        if (key2 === "default") {
          if (typeof value === "string") {
            return value;
          } else {
            return normalize(
              rootKey,
              imports,
              mode2,
              module2,
              platform2,
              customConditions2
            );
          }
        }
        continue;
      }
      return rootKey;
    }
  }
  const { mode, module, platform, customConditions } = bundleOptions;
  const result = {
    imports: {}
  };
  for (const [key2, imports] of Object.entries(importMaps.imports)) {
    result.imports[key2] = normalize(
      key2,
      imports,
      mode,
      module,
      platform,
      customConditions
    );
  }
  return result;
}
function replaceSubpathPattern(importMaps, modulePath) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
  if (importMaps.imports[modulePath]) {
    return importMaps.imports[modulePath];
  }
  const importsEntries = Object.entries(importMaps.imports).sort(([from, _to]) => {
    if (from.includes("*")) {
      return -1;
    }
    return 0;
  });
  const matchCache = {};
  for (const [fromPrefix, toPrefix] of importsEntries) {
    if (modulePath.startsWith(fromPrefix)) {
      return modulePath.replace(fromPrefix, toPrefix);
    }
    const fromPrefixMatch = matchCache[fromPrefix] || fromPrefix.match(importSubpathPattern);
    const toPrefixMatch = matchCache[toPrefix] || toPrefix.match(importSubpathPattern);
    const modulePathMatch = matchCache[modulePath] || modulePath.match(importSubpathPattern);
    if (((_a = fromPrefixMatch == null ? void 0 : fromPrefixMatch.groups) == null ? void 0 : _a["dirname"]) === ((_b = modulePathMatch == null ? void 0 : modulePathMatch.groups) == null ? void 0 : _b["dirname"])) {
      if (((_c = fromPrefixMatch == null ? void 0 : fromPrefixMatch.groups) == null ? void 0 : _c["filename"]) === "*") {
        return (((_d = toPrefixMatch == null ? void 0 : toPrefixMatch.groups) == null ? void 0 : _d["dirname"]) || "") + (((_e = toPrefixMatch == null ? void 0 : toPrefixMatch.groups) == null ? void 0 : _e["base"]) === "*" ? ((_f = modulePathMatch == null ? void 0 : modulePathMatch.groups) == null ? void 0 : _f["filename"]) + (((_g = toPrefixMatch == null ? void 0 : toPrefixMatch.groups) == null ? void 0 : _g["ext"]) || "") : ((_h = toPrefixMatch == null ? void 0 : toPrefixMatch.groups) == null ? void 0 : _h["filename"]) || "");
      }
      if (((_i = fromPrefixMatch == null ? void 0 : fromPrefixMatch.groups) == null ? void 0 : _i["base"]) === "*") {
        if (((_j = fromPrefixMatch == null ? void 0 : fromPrefixMatch.groups) == null ? void 0 : _j["ext"]) === ((_k = toPrefixMatch == null ? void 0 : toPrefixMatch.groups) == null ? void 0 : _k["ext"]) && ((_l = fromPrefixMatch == null ? void 0 : fromPrefixMatch.groups) == null ? void 0 : _l["ext"]) === ((_m = modulePathMatch == null ? void 0 : modulePathMatch.groups) == null ? void 0 : _m["ext"])) {
          return (((_n = toPrefixMatch == null ? void 0 : toPrefixMatch.groups) == null ? void 0 : _n["dirname"]) || "") + (((_o = modulePathMatch == null ? void 0 : modulePathMatch.groups) == null ? void 0 : _o["filename"]) || "");
        }
      }
    }
  }
  return modulePath;
}

// src/plugins/esbuildImportMapsPlugin.ts
import * as path6 from "node:path";
function makePlugin({
  context,
  importMaps
}) {
  const isExternalPath = (path9) => !isFileSystemReference(path9);
  const resolveModulePathFromImportMaps = (modulePath) => {
    return path6.resolve(path6.dirname(context.importMapsPath), modulePath).replace(".js", ".ts");
  };
  return {
    name: "@nanobundle/import-maps",
    setup(build2) {
      build2.onResolve({ filter: /.*/ }, (args) => {
        if (isExternalPath(args.path)) {
          const modulePath = replaceSubpathPattern(importMaps, args.path);
          const external = isExternalPath(modulePath);
          return {
            path: external ? modulePath : resolveModulePathFromImportMaps(modulePath),
            external
          };
        }
      });
    }
  };
}

// src/plugins/esbuildEmbedPlugin.ts
function makePlugin2({
  context: {
    reporter: reporter2,
    standalone,
    externalDependencies,
    forceExternalDependencies
  }
}) {
  const ownedModule = (packageName, modulePath) => {
    return packageName === modulePath || modulePath.startsWith(packageName + "/");
  };
  const isNodeApi = (modulePath) => {
    if (externalDependencies.some((dep) => modulePath.startsWith(dep))) {
      return false;
    }
    return modulePath.startsWith("node:") || nodeApis.some((api) => ownedModule(api, modulePath));
  };
  const shouldEmbed = (modulePath) => {
    if (forceExternalDependencies.some((dep) => ownedModule(dep, modulePath))) {
      return false;
    }
    return standalone || !externalDependencies.some((dep) => ownedModule(dep, modulePath));
  };
  return {
    name: "nanobundle/embed",
    setup(build2) {
      let dependOnNode = false;
      build2.onResolve({ filter: /.*/ }, async (args) => {
        if (isFileSystemReference(args.path)) {
          return;
        }
        let resolvedAsNodeApi = isNodeApi(args.path);
        if (resolvedAsNodeApi) {
          dependOnNode = true;
        }
        let external = resolvedAsNodeApi || !shouldEmbed(args.path);
        let path9 = external ? args.path : void 0;
        return { path: path9, external };
      });
      build2.onEnd(() => {
        if (standalone && dependOnNode) {
          reporter2.warn("Not completely standalone bundle, while the code depends on some Node.js APIs.");
        }
      });
    }
  };
}
var nodeApis = [
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "crypto",
  "diagnostics_channel",
  "dns",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "readline",
  "stream",
  "string_decoder",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "dgram",
  "url",
  "util",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
  // legacy
  "querystring",
  // deprecated
  "_linklist",
  "_stream_wrap",
  "constants",
  "domain",
  "punycode",
  "sys"
];

// src/tasks/buildBundleTask.ts
var BuildBundleTaskError = class extends NanobundleError {
  esbuildErrors;
  constructor(message, errors) {
    super(message);
    this.esbuildErrors = errors;
  }
};
async function buildBundleTask({
  context,
  bundleEntries
}) {
  if (!context.bundle) {
    context.reporter.debug("buildBundleTask skipped since bundle=false");
    return { outputFiles: [] };
  }
  if (bundleEntries.length > 0) {
    context.reporter.debug(`start buildBundleTask for ${bundleEntries.length} entries`);
  } else {
    context.reporter.debug("there are no js entries, skipped buildBundleTask");
    return { outputFiles: [] };
  }
  const importMaps = await loadImportMaps(context);
  const validImportMaps = await validateImportMaps({ context, importMaps });
  const bundleGroup = groupBundleEntries(bundleEntries);
  const subtasks = [];
  for (const [optionsHash, entries] of Object.entries(bundleGroup)) {
    const options = optionsFromHash(optionsHash);
    context.reporter.debug("bundle options %o", options);
    subtasks.push(
      buildBundleGroup({
        context,
        options,
        bundleEntries: entries,
        validImportMaps,
        plugins: []
      })
    );
  }
  const results = await Promise.all(subtasks);
  const errors = results.flatMap((result) => result.errors);
  if (errors.length > 0) {
    throw new BuildBundleTaskError("Some errors occur while running esbuild", errors);
  }
  const warnings = results.flatMap((result) => result.warnings);
  if (warnings.length > 0) {
    for (const warning of warnings) {
      context.reporter.warn(warning.text);
    }
  }
  const outputFiles = results.flatMap((result) => result.outputFiles).map((outputFile) => ({
    path: outputFile.path,
    content: outputFile.contents
  }));
  return { outputFiles };
}
async function buildBundleGroup({
  context,
  plugins,
  validImportMaps,
  bundleEntries,
  options
}) {
  var _a, _b;
  const baseDir = path7.resolve(context.cwd);
  const entryPointsEntries = [];
  for (const entry of bundleEntries) {
    const sourceFile = await chooseExist(entry.sourceFile);
    if (!sourceFile) {
      throw new BuildBundleTaskError(dedent3`
        Source file doesn not exist.

          Expected one of
            - ${entry.sourceFile.join("\n    - ")}

          But no matched files found.

        Please check your ${key("rootDir")} or ${key("outDir")} and try again.
        You can configure it in your ${path("tsconfig.json")}, or in CLI by ${command("--root-dir")} and ${command("--out-dir")} argument.

      `, []);
    }
    entryPointsEntries.push([
      path7.relative(
        baseDir,
        entry.outputFile.replace(/\.[^\.]+$/, "")
      ),
      sourceFile
    ]);
  }
  const entryPoints = Object.fromEntries(entryPointsEntries);
  context.reporter.debug("esbuild entryPoints: %o", entryPoints);
  const esbuildOptions = {
    entryPoints,
    outdir: baseDir,
    bundle: true,
    tsconfig: context.tsconfigPath,
    jsx: context.jsx,
    jsxDev: context.jsxDev,
    jsxFactory: context.jsxFactory,
    jsxFragment: context.jsxFragment,
    jsxImportSource: context.jsxImportSource,
    treeShaking: true,
    keepNames: true,
    target: context.targets,
    format: options.module === "commonjs" ? "cjs" : "esm",
    sourcemap: options.sourcemap,
    legalComments: "linked",
    minify: options.minify,
    plugins: [],
    conditions: options.customConditions
  };
  if (options.platform === "deno") {
    esbuildOptions.platform = "neutral";
  } else {
    esbuildOptions.platform = options.platform;
  }
  if (options.mode) {
    esbuildOptions.define = {
      "process.env.NODE_ENV": JSON.stringify(options.mode)
    };
  }
  const importMaps = normalizeImportMaps(validImportMaps, options);
  const importMapsPlugin = makePlugin({ context, importMaps });
  (_a = esbuildOptions.plugins) == null ? void 0 : _a.push(importMapsPlugin);
  const embedPlugin = makePlugin2({ context });
  (_b = esbuildOptions.plugins) == null ? void 0 : _b.push(embedPlugin);
  esbuildOptions.plugins = [
    ...esbuildOptions.plugins ?? [],
    ...plugins
  ];
  context.reporter.debug("esbuild build options %o", esbuildOptions);
  const result = await esbuild.build({
    ...esbuildOptions,
    write: false
  });
  const outputFiles = result.outputFiles.map((outputFile) => ({
    ...outputFile,
    path: outputFile.path
  }));
  return {
    errors: result.errors,
    warnings: result.warnings,
    outputFiles
  };
}

// src/tasks/buildFileTask.ts
import * as fs4 from "node:fs/promises";
import dedent4 from "string-dedent";
var BuildFileTaskError = class extends NanobundleError {
  reasons;
  constructor(reasons) {
    super();
    this.reasons = reasons;
  }
};
async function buildFileTask({
  context,
  fileEntries
}) {
  if (!context.bundle) {
    context.reporter.debug("buildFileTask skipped since bundle=false");
    return { outputFiles: [] };
  }
  if (fileEntries.length > 0) {
    context.reporter.debug(`start buildFileTask for ${fileEntries.length} entries`);
  } else {
    context.reporter.debug("there are no file entries, skipped buildFileTask");
    return { outputFiles: [] };
  }
  const subtasks = [];
  for (const entry of fileEntries) {
    const sourceFile = entry.sourceFile[0];
    const outputFile = entry.outputFile;
    if (sourceFile === outputFile) {
      context.reporter.debug(dedent4`
        noop for ${key(entry.key)} because of source path and output path are the same.
          entry path: ${path(entry.entryPath)}
      `);
      continue;
    }
    subtasks.push(buildFile({ sourceFile, outputFile }));
  }
  const results = await Promise.allSettled(subtasks);
  const rejects = results.filter((result) => result.status === "rejected");
  if (rejects.length) {
    throw new BuildFileTaskError(rejects.map((reject) => reject.reason));
  }
  const resolves = results;
  const outputFiles = resolves.map((result) => result.value.outputFile);
  return { outputFiles };
}
async function buildFile({
  sourceFile,
  outputFile
}) {
  const content = await fs4.readFile(sourceFile);
  return {
    outputFile: {
      sourcePath: sourceFile,
      path: outputFile,
      content
    }
  };
}

// src/tasks/buildTypeTask.ts
import dedent5 from "string-dedent";
import { parseNative } from "tsconfck";
var BuildTypeTaskError = class extends NanobundleError {
};
var BuildTypeTaskTsError = class extends NanobundleError {
  constructor(ts, host, diagnostics) {
    const message = dedent5`
      [error] TypeScript compilation failed

      ${indent(
      colorEnabled ? ts.formatDiagnosticsWithColorAndContext(diagnostics, host) : ts.formatDiagnostics(diagnostics, host),
      1
    )}
    `;
    super(message);
  }
};
async function buildTypeTask({
  context,
  typeEntries
}) {
  if (!context.declaration) {
    context.reporter.debug("buildTypeTask skipped since declaration=false");
    return { outputFiles: [] };
  }
  if (!context.tsconfigPath) {
    context.reporter.debug(`buildTypeTask skipped since no tsconfig.json provided`);
    return { outputFiles: [] };
  }
  if (typeEntries.length > 0) {
    context.reporter.debug(`start buildTypeTask for ${typeEntries.length} entries`);
  } else {
    context.reporter.debug("there are no dts entries, skipped buildTypeTask");
    return { outputFiles: [] };
  }
  let ts;
  try {
    ts = await import("typescript").then((mod) => mod.default);
  } catch (error) {
    throw new BuildTypeTaskError(dedent5`
      Couldn't load TypeScript API

        Try ${command("npm i -D typescript")} or ${command("yarn add -D typescript")} and build again.

    `);
  }
  context.reporter.debug("loaded TypeScript compiler API version %s", ts.version);
  const { result } = await parseNative(context.tsconfigPath);
  const compilerOptions = {
    ...result.options,
    rootDir: context.rootDir,
    outDir: context.outDir,
    allowJs: true,
    composite: false,
    incremental: false,
    skipLibCheck: true,
    declaration: true,
    emitDeclarationOnly: true
  };
  if (compilerOptions.noEmit) {
    context.reporter.warn(dedent5`
      Ignored ${key("noEmit")} specified in your tsconfig.json

        You can disable emitting declaration via ${command("--no-dts")} flag.

    `);
  }
  compilerOptions.noEmit = false;
  if (!(compilerOptions.moduleResolution === ts.ModuleResolutionKind.Node16 || compilerOptions.moduleResolution === ts.ModuleResolutionKind.NodeNext)) {
    context.reporter.warn(dedent5`
      nanobundle recommends to use ${literal("Node16")} or ${literal("NodeNext")} for ${key("compilerOptions.moduleResolution")}

        See ${hyperlink("https://www.typescriptlang.org/docs/handbook/esm-node.html")} for more detail.

    `);
  }
  context.reporter.debug("loaded compilerOptions %o", compilerOptions);
  const outputMap = /* @__PURE__ */ new Map();
  const host = ts.createCompilerHost(compilerOptions);
  host.writeFile = (filename, content) => {
    context.reporter.debug(`ts program emitted file to ${path(filename)}`);
    outputMap.set(filename, Buffer.from(content, "utf-8"));
  };
  const otherDiagnostics = [];
  for (const entry of typeEntries) {
    const program = ts.createProgram(entry.sourceFile, compilerOptions, host);
    context.reporter.debug(`created ts program from %o`, entry.sourceFile);
    const result2 = program.emit();
    const allDiagnostics = dedupeDiagnostics(
      ts.getPreEmitDiagnostics(program).concat(result2.diagnostics)
    );
    const errrorDiagnostics = [];
    for (const diagnostic of allDiagnostics) {
      if (diagnosticIgnores.includes(diagnostic.code)) {
        continue;
      }
      switch (diagnostic.category) {
        case ts.DiagnosticCategory.Error: {
          errrorDiagnostics.push(diagnostic);
          break;
        }
        default: {
          otherDiagnostics.push(diagnostic);
          break;
        }
      }
    }
    if (errrorDiagnostics.length > 0) {
      throw new BuildTypeTaskTsError(
        ts,
        host,
        errrorDiagnostics
      );
    }
  }
  if (otherDiagnostics.length > 0) {
    context.reporter.warn(
      colorEnabled ? ts.formatDiagnosticsWithColorAndContext(otherDiagnostics, host) : ts.formatDiagnostics(otherDiagnostics, host)
    );
  }
  const outputFiles = [...outputMap.entries()].map(([path9, content]) => ({
    path: path9,
    content
  }));
  return { outputFiles };
}
function dedupeDiagnostics(diagnostics) {
  const unique = [];
  const rootCodes = /* @__PURE__ */ new Set();
  const files = /* @__PURE__ */ new Set();
  for (const diagnostic of diagnostics) {
    if (diagnostic.file) {
      if (!files.has(diagnostic.file.fileName)) {
        files.add(diagnostic.file.fileName);
        unique.push(diagnostic);
      }
    } else {
      if (!rootCodes.has(diagnostic.code)) {
        rootCodes.add(diagnostic.code);
        unique.push(diagnostic);
      }
    }
  }
  return unique;
}
var diagnosticIgnores = [
  6053
];

// src/tasks/chmodBinTask.ts
import * as fs5 from "node:fs/promises";
async function chmodBinTask({
  context,
  binEntries
}) {
  const subtasks = [];
  for (const entry of binEntries) {
    subtasks.push(
      fs5.chmod(entry.outputFile, "+x")
    );
  }
  await Promise.all(subtasks);
  return {};
}

// src/tasks/cleanupTask.ts
import * as fs6 from "node:fs/promises";
var CleanupTaskError = class extends NanobundleError {
  reasons;
  constructor(reasons) {
    super();
    this.reasons = reasons;
  }
};
async function cleanupTask({
  context,
  outputFiles
}) {
  const resolvedOutDir = context.resolvePath(context.outDir);
  const relativeOutDir = context.resolveRelativePath(resolvedOutDir);
  if (relativeOutDir !== "" && !relativeOutDir.startsWith("..")) {
    context.reporter.info(`\u{1F5D1}\uFE0F  ${path("./" + relativeOutDir)}`);
    await fs6.rm(resolvedOutDir, { recursive: true, force: true });
    return {};
  }
  const subtasks = [];
  for (const file of outputFiles) {
    if (file.path === file.sourcePath) {
      context.reporter.debug(`src=dest for ${file.path}, skipping`);
      continue;
    }
    context.reporter.info(`\u{1F5D1}\uFE0F  ${path("./" + context.resolveRelativePath(file.path))}`);
    subtasks.push(fs6.rm(file.path, { force: true }));
  }
  const results = await Promise.allSettled(subtasks);
  const rejects = results.filter((result) => result.status === "rejected");
  if (rejects.length) {
    throw new CleanupTaskError(rejects.map((reject) => reject.reason));
  }
  return {};
}

// src/tasks/emitTask.ts
import * as fs7 from "node:fs/promises";
import * as path8 from "node:path";
var EmitTaskError = class extends NanobundleError {
  reasons;
  constructor(reasons) {
    super();
    this.reasons = reasons;
  }
};
async function emitTask({
  outputFiles
}) {
  const subtasks = [];
  for (const outputFile of outputFiles) {
    subtasks.push(
      fs7.mkdir(path8.dirname(outputFile.path), { recursive: true }).then(() => fs7.writeFile(outputFile.path, outputFile.content))
    );
  }
  const results = await Promise.allSettled(subtasks);
  const rejects = results.filter((result) => result.status === "rejected");
  if (rejects.length) {
    throw new EmitTaskError(rejects.map((reject) => reject.reason));
  }
  return { outputFiles };
}

// src/tasks/reportEmitResultsTask.ts
import * as zlib from "node:zlib";
import { promisify } from "node:util";
import dedent6 from "string-dedent";
import prettyBytes from "pretty-bytes";
var gzip2 = promisify(zlib.gzip);
var brotli = promisify(zlib.brotliCompress);
async function reportEmitResultsTask({
  context,
  bundleOutputs,
  fileOutputs,
  typeOutputs
}) {
  const bundles = bundleOutputs.filter((bundle) => !bundle.path.endsWith(".map")).filter((bundle) => !bundle.path.endsWith(".LEGAL.txt"));
  const lastBundle = bundles.at(-1);
  const plural = bundles.length !== 1;
  context.reporter.info(dedent6`
    ${plural ? "Bundles" : "A bundle"} generated

  `);
  for (const bundle of bundles) {
    const [gzipped, brotlied] = await Promise.all([
      gzip2(bundle.content),
      brotli(bundle.content)
    ]);
    context.reporter.info(dedent6`
      📦 ${path(context.resolveRelativePath(bundle.path, true))}${context.verbose ? "\n" + indent(dedent6`
        Size      : ${prettyBytes(bundle.content.byteLength)}
        Size (gz) : ${prettyBytes(gzipped.byteLength)}
        Size (br) : ${prettyBytes(brotlied.byteLength)}

      `, 1) : bundle === lastBundle ? "\n" : ""}
    `);
  }
  if (typeOutputs.length > 0) {
    context.reporter.info(dedent6`
      Also ${typeOutputs.length} declaration ${plural ? "files are" : "file is"} generated

      ${context.verbose ? `  \u{1F4E6} ${typeOutputs.map((output) => path(context.resolveRelativePath(output.path, true))).join("\n  \u{1F4E6} ")}
` : ""}
    `);
  }
  if (fileOutputs.length > 0) {
    for (const file of fileOutputs) {
      context.reporter.info(dedent6`
        Copied ${path(context.resolveRelativePath(file.sourcePath, true))} to ${path(context.resolveRelativePath(file.path, true))}
      `);
    }
    console.log();
  }
}

// src/commands/build/build.machine.ts
var buildMachine = (
  /** @xstate-layout N4IgpgJg5mDOIC5QCMCuBLANhAsgQwGMALdAOzADpkB7agF1joCc8AHAYgCEBVASQBkAIgG0ADAF1EoVtVjo66aqSkgAHogCMGgEwUAnKO0BmHaIAcAdj0BWa9o0AaEAE9EAFlF6K2s2Y163ADZtN0tQ6wBfCKc0LFxCEnIqWgZmNnYAYX4AUQBBADkxSSQQGTkFJRV1BABaMyMKCyMQi2Mjcw89MydXBFtdIyNAs20LDSttAyMomIxsfGIySljsbNJmdDh2CCVKRjw6Zbn4xaSViDWNuCKVMvlFZRLqszcvIwNJjVE3C0CLa26Lk02m+FDc2lsYxGzUGbhmIHOC0SRzilyYm1g212FH2hyoxyRS3xqPW6OuGmK0lk90qT0QzQ0FGa4KM1kCon8xkBvVMbjBEOsQXBelZrPhiISRPOaIxxOwnFQpAgmDAMrgcogWKSZAAbtQANYo+aSs7HNWwDUKpUq80ahC66gEA4PIo3Ep3CqPUDVQLsijmax6L7-GwWDk9TRGPk+Iz1Nw-Nm-IwWcUEk1Gi6k2XnK3K1VZ9XndhgJhMahMCisTAHABm5YAthrCaaSVcLTnFXnbed7aQ9U7Pa6JLdqZ6qohfaJ-WZA8HA9Yw44gQhjIyXsmIdotxYgsNU3Fmxnu8cAGJYfNtjVaygOw1N9Ma49xM82gvt469-vOpRDymlUcPOOCCBLGFAgW4XwQcm1iiCYEYIKEuijCC9Rhu8OgptECJpqcR5vhqL4XmS75xMWpblpW1Z0HWTCNhKuGPvh5yEU+2Cfo636kL+I7lIBdLAaB4GQRo0GwUuvQLl49T+DubgwV00xYfRyKMZe5wACrOKwRHZsc14ULeGaHqpxEapp2msRA7EDi6EhulSvG0t6E6gbJVgiSKQxbvB0n6P4QaCno7IWCF+7Ggx0pMcc5k6YWeklmWFZVrWDb3hFZpRXEMWWdZnHce6AFOWoLlmI08bue8gzBNo8F6JMYJWGYojBG4JihGFJwqWA9byOa+mGWlXU9XQ5q5YOdnDgVjlesVCBRqV1gaCMgStWM2i+v88EaEEugeJMTRLa0ViYbMB4Pt1vVvmRiWUSltGDUSF0jW+Y22eI9n-tNQGBoEjTDO0Zjsv4JjcpGC7+jGIQeKEAQdcZBAqngpCoBwOzan2BpGQ+CNgEjKOvT+E1-h6fHOQggPWBD0lRt8Iq2FtMGUytegBBoAKsqMgRw9jiPIxwCUUcl1GpcpRI43jrAE1xRM8TSM3PIElMvID22tF864M5YFAzs1UbDGMQZwkpOEqcQ9bUBAnBkH1aM3hjd6i0kZsW1bpCjQ6NmE+9k0OXLQHBFOogcjGASBOMIRba0v3jKKojWBzIFmNzDHO5b1tXQLSVUTRdEm2LRDm2nbsvR7eUy1Nfv8QH2v2GHGhh+trSR00-pLaEgRBdtQxJ8bZ0MUwYAyEwI3DQASnAqCYAw-X21j-eD+WI-yOPsCTwwUv5b7Y78TUowUCJcbhK1TWWNYW0gZTrIQf8vi+mz2jJypA9D0vdAr2vmK2wZs8PUkz+L9kMeE8p6wA3nZCkstt5k1eKVZotcTDs02sueurImSCnGACQGYdIi93CqbXmKMzxMEYDPPUDs85OwIawIhjAwHe2JoVeWiAahRkpgfWwfh2ZxzPsuRWug1YBF8FuduRtTp4LFlQmhdBrqC2ziLChlBxZ8ykXQj6JMirVBYfGMEfwuhB08OyPQFh4JhkDiFbu0NOh6CiFhUgFs4AqEdmASBpNZosJFPvWMHC2b1G4fBGoOhSps27iFNC7QNCPylCkRgLBWAuI0cwoM2swyvA5D8Lond4KtV0KIHcis7As3Wn4LmuDOpSgym2eJTC5omH0PGDkaSqohB4b0GoHgwI7kWt3eooxYalOMpFNSxxcyvkqRXKBs1YxTggnVQU605mhyyb9Jqu5YIij+OCB+-SHyDNMh2a0sUSLYCqUBcEpUZkQnBIrYUQQtqhAoJJaGLw6paHjpElsqxMryk7KM0yq8CAEDgPAcZrjqgGCnL8SYZhwW+mhgzCw-p-gwMDC84J7y8JDLiCMw5FAax4CwKgAeJz+Lgr+lCmFK1vjwUuWBUU0K9Y+DbuikyulnznnNMSsmyYvABA8F8LuXk5LwXeHyCYlh-JBX6IpMRZSPmZkxdgFiXyICctmuCBFvKGkCpai09wQUHl-GubktygNmW7NZYq9l+F-mAtgMCreoLEAzgaItDu9cQL-DEvBRm-oPU-BGCakpMqBkVL2aeK1l48UEqJSChJ5N44PPrkGX0ok4K8MMGBYwicFxySWls4NOzQ0WogNlN8qrqhTP0O5FNnlghGBMdo+paF3IjEMGaotcUspaRxecct7gfBVuTSBWtxgfJBG8GzcIgNO4+Hba2MNXaLLWtQACoFfb427T8L8WCp9DCg3jaK15Vgw4zp7gW9K87i2lsjfizAhLnGxuqTOTd4x2Sxk9T4WqdhvBjB+LBX0-183YT7kNS6YyHVxtYUycwddvj5LZLqhAIk2RMhMCmlaOgRInWA+IpItt10zi8EtHWnS2Qg0jhmvNd8RL+C0MypRKMCMrWg4mTwetoRbVZNHV46ErkBBCPRguLt07gc+pXLlrUwKA3sL4do27kwUd0H8E1dhkwQWZf-YegDl7AIYOuwYDRc2A2+JYd4nhEP3w1SzGjTVJiCmw04igDHqHoGIXQddATBhMjDsmF43wdxYfgn8SmxrRTBGdV0GxEQgA */
  createMachine({
    tsTypes: {},
    schema: {
      events: {},
      context: {}
    },
    predictableActionArguments: true,
    id: "buildMachine",
    initial: "bootstrap",
    states: {
      bootstrap: {
        on: {
          BUILD: {
            target: "buildEntries",
            actions: "reportBuildStart"
          },
          CLEAN: "cleanupFirst"
        }
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
                      actions: "assignBundleOutputs"
                    }
                  ],
                  onError: [
                    {
                      target: "failure",
                      actions: "assignBuildBundleError"
                    }
                  ]
                }
              },
              success: {
                type: "final"
              },
              failure: {
                type: "final"
              }
            }
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
                      actions: "assignFileOutputs"
                    }
                  ],
                  onError: [
                    {
                      target: "failure",
                      actions: "assignBuildFileError"
                    }
                  ]
                }
              },
              success: {
                type: "final"
              },
              failure: {
                type: "final"
              }
            }
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
                      actions: "assignTypeOutputs"
                    }
                  ],
                  onError: [
                    {
                      target: "failure",
                      actions: "assignBuildTypeError"
                    }
                  ]
                }
              },
              success: {
                type: "final"
              },
              failure: {
                type: "final"
              }
            }
          }
        },
        type: "parallel",
        onDone: [
          {
            target: "cleanup",
            cond: "hasBuildErrors",
            actions: "reportBuildErrors"
          },
          {
            target: "emitEntries"
          }
        ]
      },
      emitEntries: {
        invoke: {
          src: "emitTask",
          onDone: [
            {
              target: "reportEmitResults"
            }
          ],
          onError: [
            {
              target: "cleanup",
              actions: "assignEmitError"
            }
          ]
        }
      },
      done: {
        entry: "reportBuildEnd",
        type: "final"
      },
      cleanup: {
        invoke: {
          src: "cleanupTask",
          onDone: [
            {
              target: "done"
            }
          ],
          onError: [
            {
              target: "done"
            }
          ]
        }
      },
      chmodBinEntries: {
        invoke: {
          src: "chmodBinTask",
          onDone: [
            {
              target: "done"
            }
          ],
          onError: [
            {
              target: "done"
            }
          ]
        }
      },
      reportEmitResults: {
        invoke: {
          src: "reportEmitResults",
          onDone: [
            {
              target: "chmodBinEntries",
              cond: "hasBinEntries"
            },
            {
              target: "done"
            }
          ]
        }
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
    }
  }, {
    guards: {
      hasBuildErrors: (ctx) => Object.values(ctx.errors).some(Boolean),
      hasBinEntries: (ctx) => ctx.entries.some((entry) => entry.key.startsWith("bin"))
    },
    actions: {
      reportBuildStart: assign({
        buildStartedAt: (_ctx) => performance.now()
      }),
      reportBuildEnd: (ctx) => {
        const hasBuildErrors = Object.values(ctx.errors).some(Boolean);
        if (hasBuildErrors) {
          return;
        }
        const endedAt = performance.now();
        const elapsedTime = (endedAt - ctx.buildStartedAt).toFixed(1);
        ctx.root.reporter.info(`\u26A1 Done in ${elapsedTime}ms.`);
      },
      reportCleanupStart: (ctx) => {
        ctx.root.reporter.info(dedent7`
          Cleanup outputs first

        `);
      },
      reportCleanupEnd: (ctx) => {
        console.log();
      },
      reportBuildErrors: (ctx) => {
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
          ...event.data.outputFiles
        ]
      }),
      assignFileOutputs: assign({
        bundleOutputs: (ctx, event) => [
          ...ctx.fileOutputs,
          ...event.data.outputFiles
        ]
      }),
      assignTypeOutputs: assign({
        typeOutputs: (ctx, event) => [
          ...ctx.typeOutputs,
          ...event.data.outputFiles
        ]
      }),
      assignBuildBundleError: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          buildBundle: event.data
        })
      }),
      assignBuildFileError: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          buildFile: event.data
        })
      }),
      assignBuildTypeError: assign((ctx, event) => {
        return {
          errors: {
            ...ctx.errors,
            buildType: event.data
          }
        };
      }),
      assignEmitError: assign({
        errors: (ctx, event) => ({
          ...ctx.errors,
          emit: event.data
        })
      })
    },
    services: {
      buildBundleTask: (ctx) => buildBundleTask({
        context: ctx.root,
        bundleEntries: ctx.entries.filter(filterBundleEntry)
      }),
      buildFileTask: (ctx) => buildFileTask({
        context: ctx.root,
        fileEntries: ctx.entries.filter(filterFileEntry)
      }),
      buildTypeTask: (ctx) => buildTypeTask({
        context: ctx.root,
        typeEntries: ctx.entries.filter(filterTypeEntry)
      }),
      emitTask: (ctx) => emitTask({
        context: ctx.root,
        outputFiles: [
          ...ctx.bundleOutputs,
          ...ctx.fileOutputs,
          ...ctx.typeOutputs
        ]
      }),
      reportEmitResults: (ctx) => reportEmitResultsTask({
        context: ctx.root,
        bundleOutputs: ctx.bundleOutputs,
        fileOutputs: ctx.fileOutputs,
        typeOutputs: ctx.typeOutputs
      }),
      cleanupTask: (ctx) => cleanupTask({
        context: ctx.root,
        outputFiles: ctx.entries.map((entry) => ({
          sourcePath: entry.sourceFile[0],
          path: entry.outputFile
        }))
      }),
      chmodBinTask: (ctx) => chmodBinTask({
        context: ctx.root,
        binEntries: ctx.entries.filter(filterBundleEntry).filter((entry) => entry.key.startsWith("bin"))
      })
    }
  })
);

// src/commands/build/index.ts
async function buildCommand({
  context,
  entries,
  cleanFirst = false
}) {
  context.reporter.info(dedent8`
    Build ${highlight(context.manifest.name || "unnamed")} package

  `);
  const service = interpret(
    buildMachine.withContext({
      root: context,
      entries,
      bundleOutputs: [],
      fileOutputs: [],
      typeOutputs: [],
      errors: {},
      buildStartedAt: performance2.now()
    })
  );
  service.start();
  if (cleanFirst) {
    service.send("CLEAN");
    service.onTransition((state) => {
      if (state.can("BUILD")) {
        service.send("BUILD");
      }
    });
  } else {
    service.send("BUILD");
  }
  return new Promise((resolve6, reject) => {
    service.onDone(() => {
      const state = service.getSnapshot();
      const hasBuildErrors = Object.values(state.context.errors).some(Boolean);
      if (hasBuildErrors) {
        reject(new NanobundleError());
      } else {
        resolve6();
      }
    });
  });
}

// src/commands/clean/index.ts
import dedent9 from "string-dedent";
async function cleanCommand({
  context,
  entries
}) {
  context.reporter.info(dedent9`
    Clean ${highlight(context.manifest.name || "unnamed")} package

  `);
  const outputFiles = entries.map((entry) => ({
    sourcePath: entry.sourceFile[0],
    path: entry.outputFile
  }));
  await cleanupTask({ context, outputFiles });
}

// src/bin.ts
var { flags, input } = cli;
var [command2] = input;
var reporter = new ConsoleReporter(console);
reporter.level = process.env.DEBUG === "true" ? "debug" : "default";
if (!command2) {
  cli.showHelp(0);
}
var supportedCommands = ["build", "clean"];
try {
  if (supportedCommands.includes(command2)) {
    const manifest = await loadManifest({ basePath: flags.cwd });
    reporter.debug("loaded manifest %o", manifest);
    const tsconfigResult = await parseTsConfig(flags.tsconfig, {
      resolveWithEmptyIfConfigNotFound: true
    });
    const tsconfigPath = tsconfigResult.tsconfigFile !== "no_tsconfig_file_found" ? tsconfigResult.tsconfigFile : void 0;
    if (tsconfigPath) {
      reporter.debug(`loaded tsconfig from ${tsconfigPath}`);
    }
    const tsconfig = tsconfigResult.tsconfigFile !== "no_tsconfig_file_found" ? tsconfigResult.tsconfig : void 0;
    if (tsconfig) {
      reporter.debug("loaded tsconfig %o", tsconfig);
    }
    const targets = await loadTargets({ basePath: flags.cwd });
    reporter.debug(`loaded targets ${targets.join(", ")}`);
    const context = parseConfig({
      flags,
      targets,
      manifest,
      tsconfig,
      tsconfigPath,
      reporter
    });
    reporter.debug(`loaded context %o`, context);
    const entries = getEntriesFromContext({
      context,
      reporter
    });
    if (entries.some((entry) => entry.module === "dts") && tsconfigPath == null) {
      throw new NanobundleConfigError2(dedent10`
        You have set ${key("types")} entry. But no ${path("tsconfig.json")} found.

          Please create ${path("tsconfig.json")} file in the current directory, or pass its path to ${command("--tsconfig")} argument.

      `);
    }
    reporter.debug(`parsed entries %o`, entries);
    if (command2 === "build") {
      await buildCommand({
        context,
        entries,
        cleanFirst: flags.clean
      });
    }
    if (command2 === "clean") {
      await cleanCommand({
        context,
        entries
      });
    }
  } else {
    throw new NanobundleError(dedent10`
      Command "${command2}" is not available.

        Run ${command("nanobundle --help")} for usage.
    `);
  }
} catch (error) {
  if (error instanceof NanobundleError) {
    if (error.message) {
      reporter.error(error.message);
    }
  } else {
    reporter.captureException(error);
  }
  process.exit(1);
}
