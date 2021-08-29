export function formatModule(module: 'esmodule' | 'commonjs') {
  switch (module) {
    case 'esmodule':
      return 'ESM';
    case 'commonjs':
      return 'CommonJS';
  }
}
