import dedent from 'string-dedent';
import { parseNative } from 'tsconfck';
import {
  type CompilerOptions,
  type CompilerHost,
  type Diagnostic,
} from 'typescript';

import * as formatUtils from '../../../formatUtils';
import { NanobundleError } from '../../../errors';
import { type Context } from '../../../context';
import { type TypeEntry } from '../entryGroup';
import { type OutputFile } from '../outputFile';

export class BuildTypeTaskError extends NanobundleError {
}

export class BuildTypeTaskTsError extends NanobundleError {
  constructor(ts: typeof import('typescript'), host: CompilerHost, diagnostics: readonly Diagnostic[]) {
    let message: string = '[error] TypeScript compilation failed';
    if (formatUtils.colorEnabled) {
      message += `  ${ts.formatDiagnosticsWithColorAndContext(diagnostics, host).split('\n').join('\n  ')}`;
    } else {
      message += `  ${ts.formatDiagnostics(diagnostics, host).split('\n').join('\n  ')}`
    }
    super(message);
  }
}

type BuildTypeTaskOptions = {
  context: Context,
  typeEntries: TypeEntry[],
}

type BuildTypeTaskResult = {
  outputFiles: OutputFile[],
}

export async function buildTypeTask({
  context,
  typeEntries,
}: BuildTypeTaskOptions): Promise<BuildTypeTaskResult> {
  if (!context.declaration) {
    context.reporter.debug('buildTypeTask skipped since declaration=false');
    return { outputFiles: [] };
  }

  if (!context.tsconfigPath) {
    context.reporter.debug(`buildTypeTask skipped since no tsconfig.json provided`);
    return { outputFiles: [] };
  }

  if (typeEntries.length > 0) {
    context.reporter.debug(`start buildTypeTask for ${typeEntries.length} entries`);
  } else {
    context.reporter.debug('there are no dts entries, skipped buildTypeTask');
    return { outputFiles: [] };
  }

  let ts: typeof import('typescript');
  try {
    ts = await import('typescript').then(mod => mod.default);
  } catch (error: unknown) {
    throw new BuildTypeTaskError(dedent`
      Couldn't load TypeScript API

      Try ${formatUtils.command('npm i -D typescript')} or ${formatUtils.command('yarn add -D typescript')} and build again.

    `);
  }

  context.reporter.debug('loaded TypeScript compiler API version %s', ts.version);

  const { result } = await parseNative(context.tsconfigPath);
  const compilerOptions: CompilerOptions = {
    ...result.options,
    allowJs: true,
    composite: false,
    incremental: false,
    skipLibCheck: true,
    declaration: true,
    emitDeclarationOnly: true,
    noEmitOnError: true,
  };

  if (compilerOptions.noEmit) {
    context.reporter.warn(dedent`
      Ignored ${formatUtils.key('noEmit')} specified in your tsconfig.json
        You can disable emitting declaration via ${formatUtils.command('--no-dts')} flag.

    `);
  }
  compilerOptions.noEmit = false;

  if (!(
    compilerOptions.moduleResolution === ts.ModuleResolutionKind.Node16 ||
    compilerOptions.moduleResolution === ts.ModuleResolutionKind.NodeNext
  )) {
    context.reporter.warn(dedent`
      nanobundle recommends to use ${formatUtils.literal('Node16')} or ${formatUtils.literal('NodeNext')} for ${formatUtils.key('compilerOptions.moduleResolution')}

        See ${formatUtils.hyperlink('https://www.typescriptlang.org/docs/handbook/esm-node.html')} for usage.

    `);
  }

  context.reporter.debug('loaded compilerOptions %o', compilerOptions);

  const outputMap = new Map<string, Uint8Array>();
  const host = ts.createCompilerHost(compilerOptions);
  host.writeFile = (filename, content) => {
    context.reporter.debug(`ts program emitted file to ${formatUtils.path(filename)}`);
    outputMap.set(filename, Buffer.from(content, 'utf-8'));
  };

  for (const entry of typeEntries) {
    const program = ts.createProgram(entry.sourceFile, compilerOptions, host);
    context.reporter.debug(`created ts program from %o`, entry.sourceFile);

    const result = program.emit();
    const allDiagnostics = dedupeDiagnostics(
      ts.getPreEmitDiagnostics(program).concat(result.diagnostics),
    );

    const errrorDignostics: Diagnostic[] = [];

    for (const diagnostic of allDiagnostics) {
      if (diagnosticIgnores.includes(diagnostic.code)) {
        continue;
      }
      switch (diagnostic.category) {
        case ts.DiagnosticCategory.Error: {
          errrorDignostics.push(diagnostic);
          break;
        }
        case ts.DiagnosticCategory.Warning: {
          const formattedMessage = ts.formatDiagnostic(diagnostic, host);
          context.reporter.warn(formattedMessage);
          break;
        }
        default: {
          const formattedMessage = ts.formatDiagnostic(diagnostic, host);
          context.reporter.info(formattedMessage);
          break;
        }
      }
    }
    if (errrorDignostics.length > 0) {
      throw new BuildTypeTaskTsError(
        ts,
        host,
        errrorDignostics,
      );
    }
  }

  const outputFiles = [...outputMap.entries()]
    .map(([path, content]) => ({
      path,
      content,
    }));

  return { outputFiles };
}

function dedupeDiagnostics(diagnostics: readonly Diagnostic[]): readonly Diagnostic[] {
  const unique: Diagnostic[] = [];

  const rootCodes = new Set<number>();
  const files = new Set<string>();

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

const diagnosticIgnores: number[] = [
  6053,
];
