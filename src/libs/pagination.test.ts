import { describe, expect, it } from 'vitest';
import { paginatedItems } from './pagination';

describe(paginatedItems, () => {
  it('reads object_list from a paginated envelope', () => {
    expect(
      paginatedItems({
        count: 1,
        num_pages: 1,
        per_page: 20,
        page: { number: 1, object_list: [{ id: 7 }] },
      }),
    ).toStrictEqual([{ id: 7 }]);
  });

  it('returns an empty array when the envelope is missing items', () => {
    expect(paginatedItems(null)).toStrictEqual([]);
    expect(
      paginatedItems({
        count: 0,
        num_pages: 0,
        per_page: 20,
        page: { number: 1, object_list: [] },
      }),
    ).toStrictEqual([]);
  });

  it('passes a bare array through', () => {
    expect(paginatedItems([{ id: 1 }])).toStrictEqual([{ id: 1 }]);
  });
});
