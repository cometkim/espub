import { describe, expect } from 'vitest';

import { loadTargets } from './target';

describe('loadTargets', test => {
  const query = (query: string) => {
    return loadTargets({ basePath: __dirname, query });
  };

  test('defaults', async () => {
    const t1 = await query('defaults');

    expect(t1).toEqual(
      expect.arrayContaining([
        expect.stringContaining('chrome'),
        expect.stringContaining('firefox'),
        expect.stringContaining('edge'),
        expect.stringContaining('ios'),
        expect.stringContaining('safari'),
      ]),
    );
  });

  test('ignore unsupported query', async () => {
    const t1 = await query('last 1 ie versions, last 1 opera versions');
    expect(t1).toEqual([]);
  });

  test('ios safari', async () => {
    const t1 = await query('last 1 ios_saf versions');
    expect(t1).toEqual(
      [expect.stringMatching(/^ios\d+/)],
    );
  });

  test('android queries', async () => {
    const t1 = await query('android > 5');
    expect(t1).toEqual(
      [expect.stringContaining('chrome')],
    );

    const t2 = await query('android <= 4.4');
    expect(t2).toEqual([]);

    const t3 = await query('last 1 and_chr versions');
    expect(t3).toEqual(
      [expect.stringContaining('chrome')],
    );

    const t4 = await query('last 1 and_ff versions');
    expect(t4).toEqual(
      [expect.stringContaining('firefox')],
    );
  });
});
