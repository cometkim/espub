import { Entry } from './entry';

export function formatModule(module: Entry['module']): string {
  return {
    esmodule: 'ESM',
    commonjs: 'CommonJS',
    file: 'File',
    dts: 'TypeScript declaration',
  }[module];
}

export function formatPlatform(platform: 'web' | 'node'): string {
  return {
    web: 'Web',
    node: 'Node.js',
  }[platform];
}
