import * as fs from 'node:fs/promises';
import ts from 'typescript';

export type TsConfig = {
  compilerOptions?: {
    target?: string,
    jsx?: string,
  },
};

type LoadTsConfigOptions = {
  tsconfigPath: string,
  basePath: string,
};

export async function loadTsConfig({
  tsconfigPath,
  basePath,
}: LoadTsConfigOptions): Promise<TsConfig | null> {
  const configPath = ts.findConfigFile(
    basePath,
    ts.sys.fileExists,
    tsconfigPath,
  );

  if (!configPath) {
    return null;
  }

  try {
    const tsconfig = await fs.readFile(configPath, 'utf8')
      .then(JSON.parse) as TsConfig
    return tsconfig;
  } catch {
    return null;
  }
}
