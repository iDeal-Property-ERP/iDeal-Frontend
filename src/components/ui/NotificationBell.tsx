'use client';

import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiFetch } from '@/libs/api';
import { useAuth } from '@/libs/auth';
import { cn } from '@/libs/utils';
import type { NotificationOutput, UnreadCountOutput } from '@/types/notification';

const POLL_INTERVAL_MS = 30_000;

/**
 * Notification bell with unread badge and dropdown list.
 * Polls the unread count every 30s and loads the list on open.
 * @returns Bell button with dropdown panel.
 */
export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const t = useTranslations('Dashboard');
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationOutput[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUnread = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    try {
      const data = await apiFetch<UnreadCountOutput>('/notifications/unread-count/');
      setUnread(data.unread_count);
    } catch {
      // silent — polling will retry
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, POLL_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [loadUnread]);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const data = await apiFetch<NotificationOutput[]>('/notifications/');
        setItems(data);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  }

  async function markRead(id: number) {
    try {
      await apiFetch(`/notifications/${id}/read/`, { method: 'POST' });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      // noop
    }
  }

  async function markAllRead() {
    try {
      await apiFetch('/notifications/read-all/', { method: 'POST' });
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch {
      // noop
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label={t('notifications_title')}
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <span className="text-sm font-semibold text-foreground">{t('notifications_title')}</span>
          <Button
            variant="link"
            size="xs"
            onClick={markAllRead}
            className="h-auto p-0 text-xs text-primary"
          >
            {t('notifications_mark_all_read')}
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('notifications_loading')}
            </p>
          )}
          {!loading && items.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {t('notifications_empty')}
            </p>
          )}
          {!loading &&
            items.map((n) => (
              <Button
                key={n.id}
                variant="ghost"
                onClick={() => {
                  if (!n.is_read) {
                    markRead(n.id);
                  }
                }}
                className={cn(
                  'flex h-auto w-full flex-col items-start gap-0.5 rounded-none border-b border-border px-4 py-3 text-left',
                  n.is_read && 'opacity-60',
                )}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{n.title}</span>
                  {!n.is_read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                </span>
                {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
              </Button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
