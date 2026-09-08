import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitSupportInquiry } from './support';

type JsonPrimitive = string | number | boolean | null | undefined;
type JsonObject = Record<string, JsonPrimitive | JsonPrimitive[] | Record<string, JsonPrimitive>>;
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

function jsonResponse(data: Record<string, JsonValue> | null, status = 200): Response {
  return Response.json({ success: true, message: 'OK', data }, { status });
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe('support API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('submits support inquiry successfully', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () =>
        await Promise.resolve(
          jsonResponse({ id: 1, status: 'new', message: 'Inquiry received successfully.' }),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await submitSupportInquiry({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Need help resetting my phone number.',
    });

    expect(res.id).toBe(1);
    expect(res.status).toBe('new');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/support/inquiries/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Need help resetting my phone number.',
        }),
      }),
    );
  });
});
