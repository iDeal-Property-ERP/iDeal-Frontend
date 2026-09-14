import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  currencyForPriceFilter,
  fetchListing,
  filtersFromSearchParams,
  formatFilterPrice,
  listingPriceSteps,
  MarketplaceFetchError,
} from './marketplace';

describe(fetchListing, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns listing detail on 200 success', async () => {
    const mockListing = {
      id: 123,
      title: 'Beautiful Apartment',
      property: { name: 'Test Property' },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ success: true, data: mockListing }, { status: 200 }),
    );

    const result = await fetchListing(123);
    expect(result).toStrictEqual(mockListing);
  });

  it('returns null on 404 response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ detail: 'Not found' }, { status: 404 }),
    );

    const result = await fetchListing(999);
    expect(result).toBeNull();
  });

  it('throws MarketplaceFetchError on 500 server error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    await expect(fetchListing(123)).rejects.toThrow(MarketplaceFetchError);
  });

  it('throws MarketplaceFetchError on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Connection refused'));

    await expect(fetchListing(123)).rejects.toThrow(MarketplaceFetchError);
  });

  it('throws MarketplaceFetchError on malformed json payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ success: true, data: null }, { status: 200 }),
    );

    await expect(fetchListing(123)).rejects.toThrow(MarketplaceFetchError);
  });
});

describe('listing price currency helpers', () => {
  it('requires a currency when a price bound is set', () => {
    expect(currencyForPriceFilter('', '500', '')).toBe('USD');
    expect(currencyForPriceFilter('UZS', '500', '')).toBe('UZS');
    expect(currencyForPriceFilter('', '', '')).toBeUndefined();
  });

  it('reads currency from discovery search params', () => {
    const filters = filtersFromSearchParams(
      new URLSearchParams('price_min=500&price_max=900&currency=UZS'),
    );
    expect(filters).toMatchObject({
      price_min: '500',
      price_max: '900',
      currency: 'UZS',
    });
  });

  it('formats filter prices for the selected currency', () => {
    expect(formatFilterPrice('500', 'USD')).toBe('$500');
    expect(formatFilterPrice('5000000', 'UZS')).toBe('5000000 UZS');
    expect(listingPriceSteps('UZS')[1]).toBe('2000000');
  });
});
