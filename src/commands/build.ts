import * as esbuild from 'esbuild';
import * as ts from 'typescript';

import type { Config } from '../config';
import type { Flags } from '../cli';
import { loadTargets } from '../target';

export async function buildCommand(config: Config, flags: Flags): Promise<number> {
  const targets = loadTargets({ basePath: flags.cwd });
  console.log(targets);

  return 0;
}
