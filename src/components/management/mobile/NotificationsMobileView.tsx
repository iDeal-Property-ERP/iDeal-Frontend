'use client';

import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/libs/api';
import { relativeTime } from '@/libs/management/format';
import { cn } from '@/libs/utils';
import type { NotificationOutput } from '@/types/notification';

/**
 * Full-screen mobile Notifications list — reached from the More menu and the
 * notification bell. Loads the list on mount, marks an unread item read
 * optimistically on tap, and supports a "Mark all read" action. Mirrors the
 * bell's endpoints (`/notifications/{id}/read/`, `/notifications/read-all/`).
 * @returns The mobile notifications view.
 */
export function NotificationsMobileView() {
  const t = useTranslations('Dashboard');
  const [items, setItems] = useState<NotificationOutput[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    /**
     * Fetches the notifications list, guarding against unmount.
     * @returns A promise that resolves once state is settled.
     */
    const load = async (): Promise<void> => {
      try {
        const data = await apiFetch<NotificationOutput[]>('/notifications/');
        if (active) {
          setItems(data);
        }
      } catch {
        if (active) {
          setItems([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  /**
   * Marks a single notification read, updating the list optimistically.
   * @param id - The notification id to mark read.
   * @returns A promise that resolves once the request settles.
   */
  async function markRead(id: number): Promise<void> {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    try {
      await apiFetch(`/notifications/${id}/read/`, { method: 'POST' });
    } catch {
      // Optimistic; the next load reconciles server state.
    }
  }

  /**
   * Marks every notification read, updating the list optimistically.
   * @returns A promise that resolves once the request settles.
   */
  async function markAllRead(): Promise<void> {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await apiFetch('/notifications/read-all/', { method: 'POST' });
    } catch {
      // Optimistic; the next load reconciles server state.
    }
  }

  /**
   * Handles a tap on a row, marking it read only when currently unread.
   * @param item - The tapped notification.
   * @returns Nothing.
   */
  function handleTap(item: NotificationOutput): void {
    if (!item.is_read) {
      void markRead(item.id);
    }
  }

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">{t('notifications_title')}</h1>
        {hasUnread && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="text-sm font-medium text-primary"
          >
            {t('notifications_mark_all_read')}
          </button>
        )}
      </header>

      {loading && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t('notifications_loading')}
        </p>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Bell className="size-6 text-muted-foreground" />
          </span>
          <p className="text-sm text-muted-foreground">{t('notifications_empty')}</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleTap(item)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-[16px] border border-border bg-card px-4 py-3 text-left',
                  item.is_read && 'opacity-60',
                )}
              >
                <span
                  className={cn(
                    'mt-1.5 size-2 shrink-0 rounded-full',
                    item.is_read ? 'bg-transparent' : 'bg-primary',
                  )}
                  aria-hidden="true"
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                  {item.body && (
                    <span className="line-clamp-2 text-sm text-muted-foreground">{item.body}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {relativeTime(item.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
