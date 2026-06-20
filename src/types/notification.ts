import type { NotificationType } from './enums';

export type NotificationOutput = {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  related_object_type: string | null;
  related_object_id: number | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UnreadCountOutput = {
  unread_count: number;
};
