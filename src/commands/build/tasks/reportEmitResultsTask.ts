import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
import dedent from 'string-dedent';
import prettyBytes from 'pretty-bytes';

import * as formatUtils from '../../../formatUtils';
import { type Context } from '../../../context';
import { type OutputFile } from '../outputFile';

const gzip = promisify(zlib.gzip);
const brotli = promisify(zlib.brotliCompress);

type ReportEmitResultsTaskOptions = {
  context: Context,
  bundleOutputs: OutputFile[],
  fileOutputs: OutputFile[],
  typeOutputs: OutputFile[],
};

export async function reportEmitResultsTask({
  context,
  bundleOutputs,
  fileOutputs,
  typeOutputs,
}: ReportEmitResultsTaskOptions): Promise<void> {
  const relPath = (filePath: string) => './' + path.relative(context.cwd, filePath);

  for (const bundle of bundleOutputs.filter(bundle => !bundle.path.endsWith('.map'))) {
    const [gzipped, brotlied] = await Promise.all([
      gzip(bundle.content),
      brotli(bundle.content),
    ]);
    context.reporter.info(dedent`
      📦 ${formatUtils.path(relPath(bundle.path))}
        Size      : ${prettyBytes(bundle.content.byteLength)}
        Size (gz) : ${prettyBytes(gzipped.byteLength)}
        Size (br) : ${prettyBytes(brotlied.byteLength)}

    `);
  }

  if (typeOutputs.length > 0) {
    for (const type of typeOutputs) {
      context.reporter.info(dedent`
        TypeScript declaration emitted to ${formatUtils.path(relPath(type.path))}
      `);
    }
    console.log();
  }

  if (fileOutputs.length > 0) {
    for (const file of fileOutputs) {
      context.reporter.info(dedent`
        Copied ${formatUtils.path(relPath(file.sourcePath!))} to ${formatUtils.path(relPath(file.path))}
      `);
    }
    console.log();
  }
}
