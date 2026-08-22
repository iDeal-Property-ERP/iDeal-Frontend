import { apiFetch, apiUpload } from '@/libs/api';
import type { PaginatedData } from '@/types/api';
import type {
  ChatConversationOutput,
  ChatConversationReportOutput,
  ChatMessagesPage,
  ChatStatus,
  ChatMessageOutput,
} from '@/types/chat';

/** Parameters accepted by the management conversation list endpoint. */
export type ChatConversationListParams = {
  page: number;
  perPage?: number;
  status?: ChatStatus;
  search?: string;
  listingId?: number;
};

/** Normalized page returned by the management conversation list adapter. */
export type ChatConversationListResult = {
  items: ChatConversationOutput[];
  total: number;
  totalPages: number;
};

/** Cursor and limit parameters accepted by the messages endpoint. */
export type ChatMessagesParams = {
  afterId?: number;
  beforeId?: number;
  limit?: number;
};

/** Pagination parameters accepted by the moderation report endpoint. */
export type ChatReportListParams = {
  resolved?: boolean;
  page?: number;
  perPage?: number;
};

/**
 * Lists management conversations with status, search, listing, and pagination filters.
 * @param params - Conversation list filters and pagination.
 * @returns The normalized conversation page.
 */
export async function listChatConversations(
  params: ChatConversationListParams,
): Promise<ChatConversationListResult> {
  const query = {
    page: params.page,
    per_page: params.perPage,
    status: params.status,
    q: params.search,
    listing_id: params.listingId,
  } satisfies Record<string, string | number | boolean | undefined>;

  const response = await apiFetch<PaginatedData<ChatConversationOutput>>('/chat/conversations/', {
    query,
  });
  return {
    items: response.page.object_list,
    total: response.count,
    totalPages: response.num_pages,
  };
}

/**
 * Loads one management conversation by ID.
 * @param id - The conversation ID.
 * @returns The conversation output.
 */
export async function getChatConversation(id: number): Promise<ChatConversationOutput> {
  return await apiFetch<ChatConversationOutput>(`/chat/conversations/${id}/`);
}

/**
 * Loads initial, older, or newer messages for a conversation.
 * @param conversationId - The conversation ID.
 * @param params - Optional cursor and page-size parameters.
 * @returns Messages and live conversation state.
 */
export async function getChatMessages(
  conversationId: number,
  params: ChatMessagesParams = {},
): Promise<ChatMessagesPage> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (params.afterId !== undefined) {
    query.after_id = params.afterId;
  }
  if (params.beforeId !== undefined) {
    query.before_id = params.beforeId;
  }
  if (params.limit !== undefined) {
    query.limit = params.limit;
  }

  return await apiFetch<ChatMessagesPage>(`/chat/conversations/${conversationId}/messages/`, {
    query: Object.keys(query).length > 0 ? query : undefined,
  });
}

/**
 * Sends a text reply and preserves the client idempotency key.
 * @param conversationId - The conversation ID.
 * @param text - The validated message body.
 * @param clientId - The client-generated idempotency key.
 * @returns The created or replayed message.
 */
export async function sendChatMessage(
  conversationId: number,
  text: string,
  clientId: string,
): Promise<ChatMessageOutput> {
  return await apiFetch<ChatMessageOutput>(`/chat/conversations/${conversationId}/messages/`, {
    method: 'POST',
    body: { text, client_id: clientId },
  });
}

/**
 * Sends an image reply as multipart form data.
 * @param conversationId - The conversation ID.
 * @param image - The validated image file.
 * @param clientId - The client-generated idempotency key.
 * @returns The created message.
 */
export async function sendChatImageMessage(
  conversationId: number,
  image: File,
  clientId: string,
): Promise<ChatMessageOutput> {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('client_id', clientId);
  return await apiUpload<ChatMessageOutput>(
    `/chat/conversations/${conversationId}/messages/image/`,
    formData,
  );
}

/**
 * Marks management messages read up to an optional message watermark.
 * @param conversationId - The conversation ID.
 * @param upToMessageId - The highest message ID visible to staff.
 * @returns The updated conversation output.
 */
export async function markChatConversationRead(
  conversationId: number,
  upToMessageId?: number,
): Promise<ChatConversationOutput> {
  return await apiFetch<ChatConversationOutput>(`/chat/conversations/${conversationId}/read/`, {
    method: 'POST',
    body: upToMessageId === undefined ? {} : { up_to_message_id: upToMessageId },
  });
}

/**
 * Archives a conversation for the shared management inbox.
 * @param id - The conversation ID.
 * @returns The updated conversation output.
 */
export async function archiveChatConversation(id: number): Promise<ChatConversationOutput> {
  return await apiFetch<ChatConversationOutput>(`/chat/conversations/${id}/archive/`, {
    method: 'POST',
    body: {},
  });
}

/**
 * Removes a conversation from the archived management view.
 * @param id - The conversation ID.
 * @returns The updated conversation output.
 */
export async function unarchiveChatConversation(id: number): Promise<ChatConversationOutput> {
  return await apiFetch<ChatConversationOutput>(`/chat/conversations/${id}/unarchive/`, {
    method: 'POST',
    body: {},
  });
}

/**
 * Blocks the mobile user from replying to a conversation.
 * @param id - The conversation ID.
 * @returns The updated conversation output.
 */
export async function blockChatConversation(id: number): Promise<ChatConversationOutput> {
  return await apiFetch<ChatConversationOutput>(`/chat/conversations/${id}/block/`, {
    method: 'POST',
    body: {},
  });
}

/**
 * Removes the mobile-user block from a conversation.
 * @param id - The conversation ID.
 * @returns The updated conversation output.
 */
export async function unblockChatConversation(id: number): Promise<ChatConversationOutput> {
  return await apiFetch<ChatConversationOutput>(`/chat/conversations/${id}/unblock/`, {
    method: 'POST',
    body: {},
  });
}

/**
 * Purges a conversation for both mobile and management users.
 * @param id - The conversation ID.
 * @returns The purge result.
 */
export async function purgeChatConversation(id: number): Promise<{ id: number; deleted: boolean }> {
  return await apiFetch<{ id: number; deleted: boolean }>(`/chat/conversations/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Lists moderation reports, optionally filtered by resolved state.
 * @param params - Resolution and pagination filters.
 * @returns The paginated report page.
 */
export async function listChatReports(
  params: ChatReportListParams = {},
): Promise<PaginatedData<ChatConversationReportOutput>> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (params.resolved !== undefined) {
    query.resolved = params.resolved;
  }
  if (params.page !== undefined) {
    query.page = params.page;
  }
  if (params.perPage !== undefined) {
    query.per_page = params.perPage;
  }
  return await apiFetch<PaginatedData<ChatConversationReportOutput>>('/chat/reports/', {
    query: Object.keys(query).length > 0 ? query : undefined,
  });
}

/**
 * Resolves a moderation report.
 * @param id - The report ID.
 * @returns The resolved report.
 */
export async function resolveChatReport(id: number): Promise<ChatConversationReportOutput> {
  return await apiFetch<ChatConversationReportOutput>(`/chat/reports/${id}/resolve/`, {
    method: 'POST',
    body: {},
  });
}
