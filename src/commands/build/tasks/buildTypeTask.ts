import dedent from 'string-dedent';
import { parseNative } from 'tsconfck';
import { type CompilerOptions } from 'typescript';

import * as formatUtils from '../../../formatUtils';
import { NanobundleError } from '../../../errors';
import { type Context } from '../../../context';
import { type TypeEntry } from '../entryGroup';
import { type OutputFile } from '../outputFile';

export class BuildTypeTaskError extends NanobundleError {
  cause: unknown;

  constructor(cause: unknown) {
    super();
    this.cause = cause;

    if (typeof cause === 'string') {
      this.message = cause;
    }
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
    context.reporter.error(dedent`
      Couldn't load TypeScript API

      Try ${formatUtils.command('npm i -D typescript')} or ${formatUtils.command('yarn add -D typescript')} and build again.

    `);
    throw new BuildTypeTaskError(error);
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

    let hasErrors = false;
    for (const dignostic of result.diagnostics) {
      const formattedMessage = ts.formatDiagnostic(dignostic, host);
      switch (dignostic.category) {
        case ts.DiagnosticCategory.Error: {
          context.reporter.error(formattedMessage);
          hasErrors = true;
          break;
        }
        case ts.DiagnosticCategory.Warning: {
          context.reporter.warn(formattedMessage);
        }
        default: {
          context.reporter.info(formattedMessage);
        }
      }
    }
    if (hasErrors) {
      throw new BuildTypeTaskError('TypeScript build failed');
    }
  }

  const outputFiles = [...outputMap.entries()]
    .map(([path, content]) => ({
      path,
      content,
    }));

  return { outputFiles };
}
