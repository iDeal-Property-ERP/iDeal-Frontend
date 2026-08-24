import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirmAccountDeletion, getDeletionChannels, requestDeletionOtp } from './accountDeletion';

type JsonPrimitive = string | number | boolean | null | undefined;
type JsonObject = Record<string, JsonPrimitive | JsonPrimitive[] | Record<string, JsonPrimitive>>;
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

function jsonResponse(data: Record<string, JsonValue> | null, status = 200): Response {
  return Response.json({ success: true, message: 'OK', data }, { status });
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe('account deletion API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches deletion channels', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () => await Promise.resolve(jsonResponse({ channels: ['telegram', 'sms'] })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await getDeletionChannels();
    expect(res.channels).toStrictEqual(['telegram', 'sms']);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/users/deletion/channels/',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('requests deletion OTP with default telegram channel', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () =>
        await Promise.resolve(
          jsonResponse({ channel: 'telegram', expires_in: 300, resend_after: 60 }),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await requestDeletionOtp({ phone: '+998901234567' });
    expect(res.channel).toBe('telegram');
    expect(res.expires_in).toBe(300);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/users/deletion/otp/request/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone: '+998901234567', channel: 'telegram' }),
      }),
    );
  });

  it('confirms account deletion with OTP', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () => await Promise.resolve(jsonResponse({ deleted: true })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await confirmAccountDeletion({ phone: '+998901234567', code: '123456' });
    expect(res.deleted).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/users/deletion/confirm/',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ phone: '+998901234567', code: '123456' }),
      }),
    );
  });
});
