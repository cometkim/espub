import dedent from 'string-dedent';
import { parseNative } from 'tsconfck';
import { type CompilerOptions } from 'typescript';

import * as formatUtils from '../../../formatUtils';
import { type Context } from '../../../context';
import { type TypeEntry } from '../entryGroup';
import { type OutputFile } from '../outputFile';

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
  const ts = await import('typescript');

  const result = await parseNative(context.tsconfigPath);

  const compilerOptions: CompilerOptions = {
    ...result.tsconfig.compilerOptions,

    allowJs: true,
    incremental: false,
    skipLibCheck: true,
    declaration: true,
    emitDeclarationOnly: true,
  };
  context.reporter.debug('ts compilerOptions %o', compilerOptions);

  if (compilerOptions.noEmit) {
    context.reporter.warn(dedent`
      Ignored ${formatUtils.key('noEmit')} specified in your tsconfig.json

      You can disable emitting declaration via ${formatUtils.command('--no-dts')} flag.
    `);
    compilerOptions.noEmit = false;
  }

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
}