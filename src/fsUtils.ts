import * as fs from 'node:fs';

export function exists(path: string): Promise<boolean> {
  return fs.promises.access(path, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export async function chooseExist(paths: string[]): Promise<string | null> {
  let result: string | null = null;
  for (const candidate of paths) {
    if (await exists(candidate)) {
      result = candidate;
      break;
    }
  }
  return result;
}

export function isFileSystemReference(path: string): boolean {
  const fileSystemReferencePattern = /^(\.{0,2}\/).*/;
  return fileSystemReferencePattern.test(path);
}
