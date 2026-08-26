import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStatusCounts } from './propertiesAdapter';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe('properties status counts helper', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('queries only supported management property statuses', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () =>
        await Promise.resolve(
          Response.json({
            success: true,
            message: 'OK',
            data: { count: 1, num_pages: 1, per_page: 1, page: { number: 1, object_list: [] } },
          }),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const counts = await getStatusCounts('tower');

    expect(counts).toStrictEqual({
      all: 1,
      rented: 1,
      vacant: 1,
      maintenance: 1,
      pending_review: 1,
    });
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toStrictEqual([
      '/api/v1/management/properties/?page=1&per_page=1&search=tower',
      '/api/v1/management/properties/?page=1&per_page=1&search=tower&status=rented',
      '/api/v1/management/properties/?page=1&per_page=1&search=tower&status=vacant',
      '/api/v1/management/properties/?page=1&per_page=1&search=tower&status=maintenance',
      '/api/v1/management/properties/?page=1&per_page=1&search=tower&status=pending_review',
    ]);
  });
});
