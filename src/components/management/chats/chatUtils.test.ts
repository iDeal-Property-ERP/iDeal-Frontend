import { describe, expect, it } from 'vitest';
import type { ChatMessageOutput } from '@/types/chat';
import {
  CHAT_MAX_IMAGE_BYTES,
  CHAT_MESSAGE_MAX_LENGTH,
  mergeChatMessages,
  validateChatImage,
  validateChatText,
} from './chatUtils';

function message(overrides: Partial<ChatMessageOutput> = {}): ChatMessageOutput {
  return {
    id: 1,
    conversation_id: 42,
    sender_id: 7,
    sender_side: 'staff',
    sender_name: 'Sam Staff',
    is_mine: true,
    kind: 'text',
    text: 'Hello',
    image_url: null,
    image_width: null,
    image_height: null,
    image_size_bytes: null,
    client_id: null,
    read_at: null,
    is_read: false,
    created_at: '2026-08-09T10:00:00+00:00',
    updated_at: '2026-08-09T10:00:00+00:00',
    ...overrides,
  };
}

describe('chat validation', () => {
  it('rejects text over the backend limit', () => {
    expect(validateChatText('x'.repeat(CHAT_MESSAGE_MAX_LENGTH))).toBeNull();
    expect(validateChatText('x'.repeat(CHAT_MESSAGE_MAX_LENGTH + 1))).toBe('too_long');
  });

  it('rejects blank text', () => {
    expect(validateChatText('   ')).toBe('empty');
  });

  it('accepts supported images up to 5 MB', () => {
    expect(
      validateChatImage(
        new File([new Uint8Array(CHAT_MAX_IMAGE_BYTES)], 'photo.PNG', { type: 'image/png' }),
      ),
    ).toBeNull();
  });

  it('rejects oversized and unsupported images', () => {
    expect(
      validateChatImage(
        new File([new Uint8Array(CHAT_MAX_IMAGE_BYTES + 1)], 'photo.png', { type: 'image/png' }),
      ),
    ).toBe('too_large');
    expect(validateChatImage(new File(['x'], 'photo.svg', { type: 'image/svg+xml' }))).toBe(
      'unsupported_type',
    );
  });
});

describe('message merging', () => {
  it('deduplicates a poll response by client id', () => {
    const optimistic = message({ id: -1, client_id: 'client-1', text: 'Pending' });
    const persisted = message({ id: 9, client_id: 'client-1', text: 'Pending', is_read: true });

    const result = mergeChatMessages([optimistic], [persisted]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 9, client_id: 'client-1', is_read: true });
  });

  it('deduplicates repeated history by server id', () => {
    const first = message({ id: 4 });
    const updated = message({ id: 4, text: 'Updated' });

    const result = mergeChatMessages([first], [updated, message({ id: 5, text: 'Next' })]);

    expect(result).toHaveLength(2);
    expect(result[0]?.text).toBe('Updated');
  });
});
