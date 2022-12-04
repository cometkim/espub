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
  if (typeEntries.length > 0) {
    context.reporter.debug(`start buildTypeTask for ${typeEntries.length} entries`);
  } else {
    context.reporter.debug('there are no dts entries, skipped buildTypeTask');
    return { outputFiles: [] };
  }

  try {
    const ts = await import('typescript').then(mod => mod.default);
    const result = await parseNative(context.tsconfigPath);

    const compilerOptions: CompilerOptions = {
      ...result.tsconfig.compilerOptions,

      allowJs: true,
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
      compilerOptions.noEmit = false;
    }
    context.reporter.debug('ts compilerOptions %o', compilerOptions);

    const outputMap = new Map<string, Uint8Array>();
    const host = ts.createCompilerHost(compilerOptions);
    host.writeFile = (filename, content) => {
      context.reporter.debug(`ts host emit file to %s`, filename);
      outputMap.set(filename, Buffer.from(content, 'utf-8'));
    };

    for (const entry of typeEntries) {
      const program = ts.createProgram(entry.sourceFile, compilerOptions, host);
      const result = program.emit();

      context.reporter.info(dedent`
        TypeScript dignostics:

          %s

        `,
        ts.formatDiagnostics(result.diagnostics, host),
      );
    }

    const outputFiles = [...outputMap.entries()]
      .map(([path, content]) => ({
        path,
        content,
      }));

    return { outputFiles };

  } catch (error: unknown) {
    throw new BuildTypeTaskError(error);
  }
}