export type NodeImportMaps = {
  imports: Record<string, string | {
    default?: string,
    node?: string,
  }>,
};

export type ImportMaps = {
  imports: Record<string, string>,
};

export function normalizeImportMaps(
  importMaps: NodeImportMaps,
  env: 'web' | 'node'
): ImportMaps {
  throw new Error('not implemented yet');
}
