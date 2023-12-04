import { describe, expect } from 'vitest';

import { loadTargets } from './target';

describe('loadTargets', test => {
  const query = (query: string) => {
    return loadTargets({ basePath: __dirname, query });
  };

  test('defaults', () => {
    const t1 = query('defaults');

    expect(t1).toEqual(
      expect.arrayContaining([
        expect.stringContaining('chrome'),
        expect.stringContaining('firefox'),
        expect.stringContaining('edge'),
        expect.stringContaining('ios'),
        expect.stringContaining('safari'),
        expect.stringContaining('node'),
        expect.stringContaining('deno'),
      ]),
    );
  });

  test('ignore unsupported query', () => {
    const t1 = query('last 1 ie versions, last 1 opera versions');
    expect(t1).toEqual([
      expect.stringContaining('node'),
      expect.stringContaining('deno'),
    ]);
  });

  test('ios safari', () => {
    const t1 = query('last 1 ios_saf versions');
    expect(t1).toEqual([
      expect.stringMatching(/^ios\d+/),
      expect.stringContaining('node'),
      expect.stringContaining('deno'),
    ]);
  });

  test('android queries', () => {
    const t1 = query('android > 5');
    expect(t1).toEqual([
      expect.stringContaining('chrome'),
      expect.stringContaining('node'),
      expect.stringContaining('deno'),
    ]);

    const t2 = query('android <= 4.4');
    expect(t2).toEqual([
      expect.stringContaining('node'),
      expect.stringContaining('deno'),
    ]);

    const t3 = query('last 1 and_chr versions');
    expect(t3).toEqual([
      expect.stringContaining('chrome'),
      expect.stringContaining('node'),
      expect.stringContaining('deno'),
    ]);

    const t4 = query('last 1 and_ff versions');
    expect(t4).toEqual([
      expect.stringContaining('firefox'),
      expect.stringContaining('node'),
      expect.stringContaining('deno'),
    ]);
  });
});
