import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchOwnerPublicOffer, prepareOwnerListingUpload } from './ownerListings';

type JsonPrimitive = string | number | boolean | null | undefined;
type JsonObject = Record<string, JsonPrimitive | JsonPrimitive[] | Record<string, JsonPrimitive>>;
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

function jsonResponse(data: Record<string, JsonValue> | null, status = 200): Response {
  return Response.json({ success: true, message: 'OK', data }, { status });
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe('owner listing upload preparation helper', () => {
  it('aligns new submission captions to every uploaded file', () => {
    const first = new File(['first'], 'first.jpg', { type: 'image/jpeg' });
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' });

    const result = prepareOwnerListingUpload(
      [
        { file: first, caption: 'Front' },
        { file: second, caption: 'Kitchen' },
      ],
      false,
    );

    expect(result).toStrictEqual({
      images: [first, second],
      captions: ['Front', 'Kitchen'],
    });
  });

  it('aligns rejected resubmission captions only to new files', () => {
    const first = new File(['first'], 'first.jpg', { type: 'image/jpeg' });
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' });

    const result = prepareOwnerListingUpload(
      [
        { caption: 'Retained server photo' },
        { file: first, caption: 'New bedroom' },
        { caption: 'Another retained photo' },
        { file: second, caption: 'New balcony' },
      ],
      true,
    );

    expect(result).toStrictEqual({
      images: [first, second],
      captions: ['New bedroom', 'New balcony'],
    });
  });
});

describe('owner public offer fetch helper', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the owner public offer', async () => {
    const offer = {
      id: 2,
      version: 'v1',
      body: 'Owner terms',
      content_hash: 'hash',
    };
    const fetchMock = vi.fn<Fetcher>(async () => await Promise.resolve(jsonResponse(offer)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchOwnerPublicOffer();
    expect(result).toStrictEqual(offer);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/owner/public-offer/',
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
