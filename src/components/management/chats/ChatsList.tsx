'use client';

import { Ban, Building2, Flag, MessageCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/libs/utils';
import type { ChatConversationOutput } from '@/types/chat';

function displayUserName(conversation: ChatConversationOutput, fallback: string): string {
  const name = `${conversation.user.first_name} ${conversation.user.last_name ?? ''}`.trim();
  return name.length > 0 ? name : (conversation.user.phone ?? fallback);
}

function formatRelativeTime(iso: string | null, locale: string): string {
  if (!iso) {
    return '';
  }
  const timestamp = Date.parse(iso);
  if (!Number.isFinite(timestamp)) {
    return '';
  }
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (minutes < 1) {
    return formatter.format(0, 'second');
  }
  if (minutes < 60) {
    return formatter.format(-minutes, 'minute');
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return formatter.format(-hours, 'hour');
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return formatter.format(-days, 'day');
  }
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(timestamp);
}

/**
 * Renders the shared inbox conversation rows with listing, counterparty, state,
 * preview, time, and unread context.
 * @param props - Conversations, selected id, and row selection handler.
 * @returns The conversation list.
 */
export function ChatsList(props: {
  conversations: ChatConversationOutput[];
  selectedId: number | null;
  onSelect: (conversation: ChatConversationOutput) => void;
}) {
  const t = useTranslations('ChatsPage');
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-2">
      {props.conversations.map((conversation) => {
        const name = displayUserName(conversation, t('unknown_user'));
        const preview =
          conversation.last_message_kind === 'image'
            ? t('photo')
            : (conversation.last_message_preview ?? t('no_message'));
        return (
          <button
            key={conversation.id}
            aria-label={t('conversation_row', { name })}
            className={cn(
              'group flex w-full items-start gap-3 rounded-[12px] border px-3.5 py-3 text-left transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              props.selectedId === conversation.id
                ? 'border-primary/40 bg-primary-subtle/45'
                : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30',
            )}
            onClick={() => props.onSelect(conversation)}
            type="button"
          >
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-muted text-muted-foreground">
              {conversation.listing.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- listing media comes from the backend host.
                <img
                  alt={conversation.listing.title}
                  className="size-full object-cover"
                  src={conversation.listing.cover_image_url}
                />
              ) : (
                <Building2 className="size-5" strokeWidth={1.5} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {conversation.listing.title}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {formatRelativeTime(conversation.last_message_at, locale)}
                </span>
              </span>
              <span className="mt-2 flex items-center gap-2">
                <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs text-muted-foreground">
                  {conversation.last_message_kind === 'image' ? (
                    <MessageCircle className="size-3.5 shrink-0" strokeWidth={1.6} />
                  ) : null}
                  <span className="truncate">{preview}</span>
                </span>
                {conversation.unread_count > 0 ? (
                  <span
                    aria-label={t('unread_count', { count: conversation.unread_count })}
                    className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground"
                  >
                    {conversation.unread_count}
                  </span>
                ) : null}
              </span>
              {conversation.deleted_by_user ||
              conversation.is_blocked ||
              conversation.report_count > 0 ? (
                <span className="mt-2 flex flex-wrap items-center gap-1.5">
                  {conversation.deleted_by_user ? (
                    <span className="rounded-full bg-danger-subtle px-2 py-0.5 text-[10px] font-semibold text-danger-subtle-foreground">
                      {t('deleted_badge')}
                    </span>
                  ) : null}
                  {conversation.is_blocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      <Ban className="size-3" />
                      {t('blocked_badge')}
                    </span>
                  ) : null}
                  {conversation.report_count > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold text-warning-subtle-foreground">
                      <Flag className="size-3" />
                      {t('reported_badge', { count: conversation.report_count })}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
