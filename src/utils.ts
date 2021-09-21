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
