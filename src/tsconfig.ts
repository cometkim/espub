import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs/promises';

export type TsConfig = {
  compilerOptions?: {
    target?: string,
    jsx?: string,
  },
};

type LoadTsConfigOptions = {
  basePath: string,
  incremental: boolean,
};

export async function loadTsConfig({
  basePath,
  incremental,
}: LoadTsConfigOptions): Promise<TsConfig> {
  const configPath = ts.findConfigFile(
    basePath,
    ts.sys.fileExists,
    'tsconfig.json',
  );

  if (!configPath) {
  }
}
