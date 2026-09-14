import { afterEach, describe, expect, it, vi } from 'vitest';
import { archiveOneOffDeal } from './oneOffDealsAdapter';

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe('one-off deals adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('archives a deal through the lifecycle action endpoint', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () =>
        await Promise.resolve(
          Response.json({
            success: true,
            message: 'OK',
            data: { id: 42, status: 'archived' },
          }),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(archiveOneOffDeal(42)).resolves.toMatchObject({ id: 42, status: 'archived' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/management/one-off-deals/42/archive/',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });
});
