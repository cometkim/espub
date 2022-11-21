import * as fs from 'node:fs';

export function exists(path: string): Promise<boolean> {
  return fs.promises.access(path, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export function isFileSystemReference(path: string): boolean {
  const fileSystemReferencePattern = /^(\.{0,2}\/).*/;
  return fileSystemReferencePattern.test(path);
}

