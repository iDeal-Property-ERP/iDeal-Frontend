/** Supported management inbox views for listing-scoped conversations. */
export type ChatStatus = 'open' | 'archived' | 'reported' | 'deleted_by_user';

/** Chat message delivery side returned by the backend. */
export type ChatSenderSide = 'user' | 'staff';

/** Chat message payload kind returned by the backend. */
export type ChatMessageKind = 'text' | 'image';

/** Counterparty profile embedded in a conversation or report. */
export type ChatUserOutput = {
  id: number;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

/** Listing reference embedded in a conversation. */
export type ChatListingOutput = {
  id: number;
  property_id: number;
  title: string;
  cover_image_url: string | null;
  price: number | null;
  currency: string;
  status: string;
  is_available: boolean;
};

/** Message schema returned by the management chat API. */
export type ChatMessageOutput = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_side: ChatSenderSide;
  sender_name: string;
  is_mine: boolean;
  kind: ChatMessageKind;
  text: string | null;
  image_url: string | null;
  image_width: number | null;
  image_height: number | null;
  image_size_bytes: number | null;
  client_id: string | null;
  read_at: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

/** Live state returned alongside a conversation message page. */
export type ChatConversationStateOutput = {
  id: number;
  is_read_only: boolean;
  deleted_by_user: boolean;
  is_blocked: boolean;
  is_archived: boolean;
  is_muted: boolean;
  unread_count: number;
  last_message_id: number | null;
  peer_last_read_message_id: number | null;
  staff_last_read_message_id: number | null;
  listing_is_available: boolean;
};

/** Conversation row schema returned by the management chat API. */
export type ChatConversationOutput = {
  id: number;
  listing_id: number;
  listing_title: string;
  listing: ChatListingOutput;
  user: ChatUserOutput;
  last_message: ChatMessageOutput | null;
  last_message_id: number | null;
  last_message_at: string | null;
  user_deleted_at: string | null;
  deleted_by_user: boolean;
  is_read_only: boolean;
  is_blocked: boolean;
  is_archived: boolean;
  is_muted: boolean;
  listing_is_available: boolean;
  last_message_preview: string | null;
  last_message_kind: ChatMessageKind | null;
  unread_count: number;
  staff_unread_count: number;
  user_unread_count: number;
  staff_last_read_message_id: number | null;
  user_last_read_message_id: number | null;
  peer_last_read_message_id: number | null;
  report_count: number;
  created_at: string;
  updated_at: string;
};

/** Message history and live state returned by one messages request. */
export type ChatMessagesPage = {
  messages: ChatMessageOutput[];
  has_more: boolean;
  conversation: ChatConversationStateOutput;
};

/** Moderation report schema returned by the chat API. */
export type ChatConversationReportOutput = {
  id: number;
  conversation_id: number;
  reported_by_id: number;
  reported_by: ChatUserOutput;
  reason: string;
  note: string;
  resolved_at: string | null;
  resolved_by_id: number | null;
  created_at: string;
  updated_at: string;
};
