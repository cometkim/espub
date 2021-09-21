export function formatModule(module: 'esmodule' | 'commonjs'): string {
  return {
    esmodule: 'ESM',
    commonjs: 'CommonJS',
  }[module];
}

export function formatPlatform(platform: 'web' | 'node'): string {
  return {
    web: 'Web',
    node: 'Node.js',
  }[platform];
}

export function isFileSystemReference(path: string): boolean {
  const fileSystemReferencePattern = /^(\.{0,2}\/).*/;
  return fileSystemReferencePattern.test(path);
}
