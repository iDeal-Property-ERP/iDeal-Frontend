import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicOffer, toOfferAcceptance } from './publicListings';

type JsonPrimitive = string | number | boolean | null | undefined;
type JsonObject = Record<string, JsonPrimitive | JsonPrimitive[] | Record<string, JsonPrimitive>>;
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

function jsonResponse(data: Record<string, JsonValue> | null, status = 200): Response {
  return Response.json({ success: true, message: 'OK', data }, { status });
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe('public listing offer helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the marketplace public offer', async () => {
    const offer = {
      id: 1,
      version: 'v1',
      body: 'Terms',
      content_hash: 'abc123',
    };
    const fetchMock = vi.fn<Fetcher>(async () => await Promise.resolve(jsonResponse(offer)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchPublicOffer();
    expect(result).toStrictEqual(offer);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/marketplace/public-offer/',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('returns offer acceptance fields when the offer is complete', () => {
    expect(
      toOfferAcceptance({
        id: 4,
        version: 'v2',
        body: 'Terms',
        content_hash: 'deadbeef',
      }),
    ).toStrictEqual({
      offer_id: 4,
      offer_version: 'v2',
      offer_hash: 'deadbeef',
    });
  });

  it('returns null when offer id, version, or hash is missing', () => {
    expect(toOfferAcceptance(null)).toBeNull();
    expect(
      toOfferAcceptance({ id: null, version: 'v1', body: 'Terms', content_hash: 'abc' }),
    ).toBeNull();
    expect(
      toOfferAcceptance({ id: 1, version: null, body: 'Terms', content_hash: 'abc' }),
    ).toBeNull();
    expect(
      toOfferAcceptance({ id: 1, version: 'v1', body: 'Terms', content_hash: null }),
    ).toBeNull();
  });
});
