import type { ChatMessageOutput } from '@/types/chat';

/** Maximum text length accepted by the chat message schema. */
export const CHAT_MESSAGE_MAX_LENGTH = 1024;

/** Maximum image size accepted by the chat upload schema. */
export const CHAT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const CHAT_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
const CHAT_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

/** Client-side text validation result. */
export type ChatTextValidationError = 'empty' | 'too_long';

/** Client-side image validation result. */
export type ChatImageValidationError = 'too_large' | 'unsupported_type';

/**
 * Validates the staff message length before an API request.
 * @param text - The draft text to validate.
 * @returns The validation error, or null when valid.
 */
export function validateChatText(text: string): ChatTextValidationError | null {
  if (text.trim().length === 0) {
    return 'empty';
  }
  if (text.length > CHAT_MESSAGE_MAX_LENGTH) {
    return 'too_long';
  }
  return null;
}

/**
 * Validates the chat image size, extension, and browser MIME type.
 * @param file - The image selected by the staff member.
 * @returns The validation error, or null when valid.
 */
export function validateChatImage(file: File): ChatImageValidationError | null {
  if (file.size > CHAT_MAX_IMAGE_BYTES) {
    return 'too_large';
  }

  const extension = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : undefined;
  if (!extension || !CHAT_IMAGE_EXTENSIONS.has(extension)) {
    return 'unsupported_type';
  }
  if (file.type && !CHAT_IMAGE_MIME_TYPES.has(file.type.toLowerCase())) {
    return 'unsupported_type';
  }
  return null;
}

function compareMessages(left: ChatMessageOutput, right: ChatMessageOutput): number {
  const leftTime = Date.parse(left.created_at);
  const rightTime = Date.parse(right.created_at);
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
    return leftTime - rightTime;
  }
  return left.id - right.id;
}

/**
 * Merges message pages while deduplicating by server id and client id.
 * @param existing - Messages already rendered in the thread.
 * @param incoming - Messages received from a new API response.
 * @returns A sorted, deduplicated message list.
 */
export function mergeChatMessages(
  existing: ChatMessageOutput[],
  incoming: ChatMessageOutput[],
): ChatMessageOutput[] {
  const merged: ChatMessageOutput[] = [];
  const indexesById = new Map<number, number>();
  const indexesByClientId = new Map<string, number>();

  for (const message of [...existing, ...incoming]) {
    const matchingIndex =
      indexesById.get(message.id) ??
      (message.client_id ? indexesByClientId.get(message.client_id) : undefined);

    if (matchingIndex !== undefined) {
      const previous = merged[matchingIndex];
      if (!previous) {
        continue;
      }
      const next = { ...previous, ...message };
      merged[matchingIndex] = next;
      indexesById.delete(previous.id);
      indexesById.set(next.id, matchingIndex);
      if (next.client_id) {
        indexesByClientId.set(next.client_id, matchingIndex);
      }
      continue;
    }

    const nextIndex = merged.length;
    merged.push(message);
    indexesById.set(message.id, nextIndex);
    if (message.client_id) {
      indexesByClientId.set(message.client_id, nextIndex);
    }
  }

  return merged.toSorted(compareMessages);
}
