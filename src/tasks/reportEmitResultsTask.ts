import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
import dedent from 'string-dedent';
import prettyBytes from 'pretty-bytes';

import * as formatUtils from '../formatUtils';
import { type Context } from '../context';
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

  const bundles = bundleOutputs
    .filter(bundle => !bundle.path.endsWith('.map'))

  const lastBundle = bundles.at(-1);

  for (const bundle of bundles) {
    const [gzipped, brotlied] = await Promise.all([
      gzip(bundle.content),
      brotli(bundle.content),
    ]);
    context.reporter.info(dedent`
      📦 ${formatUtils.path(relPath(bundle.path))}${context.verbose ? '\n' + formatUtils.indent(dedent`
        Size      : ${prettyBytes(bundle.content.byteLength)}
        Size (gz) : ${prettyBytes(gzipped.byteLength)}
        Size (br) : ${prettyBytes(brotlied.byteLength)}

      `, 1) : (bundle === lastBundle ? '\n' : '')}
    `);
  }

  if (typeOutputs.length > 0) {
    context.reporter.info(dedent`
      Also ${typeOutputs.length} declaration ${typeOutputs.length === 1 ? 'file is' : 'files are'} generated
      ${context.verbose
        ? `  📦 ${typeOutputs.map(output => formatUtils.path(relPath(output.path))).join('\n  📦 ')}\n`
        : ''
      }
    `);
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
