import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  archiveChatConversation,
  blockChatConversation,
  getChatConversation,
  getChatMessages,
  listChatConversations,
  listChatReports,
  markChatConversationRead,
  purgeChatConversation,
  resolveChatReport,
  sendChatImageMessage,
  sendChatMessage,
  unarchiveChatConversation,
  unblockChatConversation,
} from './chatAdapter';

function jsonResponse(data: unknown, status = 200): Response {
  return Response.json({ success: true, message: 'OK', data }, { status });
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

describe('chat adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds conversation list filters with backend query names', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () =>
        await Promise.resolve(
          jsonResponse({
            count: 0,
            num_pages: 1,
            per_page: 50,
            page: { number: 2, object_list: [] },
          }),
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await listChatConversations({
      page: 2,
      perPage: 50,
      status: 'reported',
      search: 'alice',
      listingId: 42,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/chat/conversations/?page=2&per_page=50&status=reported&q=alice&listing_id=42',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('builds message cursors and preserves the trailing slash', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () =>
        await Promise.resolve(jsonResponse({ messages: [], has_more: false, conversation: {} })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await getChatMessages(42, { afterId: 991, limit: 30 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/chat/conversations/42/messages/?after_id=991&limit=30',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('uses JSON, multipart, and action endpoint shapes', async () => {
    const fetchMock = vi.fn<Fetcher>(
      async () => await Promise.resolve(jsonResponse({ id: 42, deleted: true })),
    );
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['image'], 'photo.png', { type: 'image/png' });

    await getChatConversation(42);
    await sendChatMessage(42, 'Hello', 'client-1');
    await sendChatImageMessage(42, file, 'client-2');
    await markChatConversationRead(42, 991);
    await archiveChatConversation(42);
    await unarchiveChatConversation(42);
    await blockChatConversation(42);
    await unblockChatConversation(42);
    await purgeChatConversation(42);
    await listChatReports({ resolved: false, page: 2, perPage: 20 });
    await resolveChatReport(7);

    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls).toStrictEqual([
      '/api/v1/chat/conversations/42/',
      '/api/v1/chat/conversations/42/messages/',
      '/api/v1/chat/conversations/42/messages/image/',
      '/api/v1/chat/conversations/42/read/',
      '/api/v1/chat/conversations/42/archive/',
      '/api/v1/chat/conversations/42/unarchive/',
      '/api/v1/chat/conversations/42/block/',
      '/api/v1/chat/conversations/42/unblock/',
      '/api/v1/chat/conversations/42/',
      '/api/v1/chat/reports/?resolved=false&page=2&per_page=20',
      '/api/v1/chat/reports/7/resolve/',
    ]);
    const [, textOptions] = fetchMock.mock.calls.at(1) ?? [];
    const [, imageOptions] = fetchMock.mock.calls.at(2) ?? [];
    expect(textOptions).toMatchObject({ method: 'POST' });
    expect(imageOptions?.body).toBeInstanceOf(FormData);
  });
});
