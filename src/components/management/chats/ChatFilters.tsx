'use client';

import { useTranslations } from 'next-intl';
import { SavedViewTabs } from '@/components/management/workbench/SavedViewTabs';
import type { SavedView } from '@/components/management/workbench/SavedViewTabs';
import { SearchField } from '@/components/management/workbench/SearchField';
import type { ChatStatus } from '@/types/chat';

const CHAT_STATUSES: ChatStatus[] = ['open', 'archived', 'reported', 'deleted_by_user'];

/**
 * Status tabs and the shared conversation search control for the chat inbox.
 * @param props - Current filter values and change handlers.
 * @returns The chat filter toolbar.
 */
export function ChatFilters(props: {
  status: ChatStatus;
  onStatusChange: (status: ChatStatus) => void;
  search: string;
  onSearchChange: (search: string) => void;
}) {
  const t = useTranslations('ChatsPage');
  const views: SavedView[] = CHAT_STATUSES.map((status) => ({
    id: status,
    label: t(`tab_${status}`),
  }));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <SavedViewTabs
        active={props.status}
        onChange={(next) => {
          // SAFETY: Selected tab ID corresponds to a valid ChatStatus
          props.onStatusChange(next as ChatStatus);
        }}
        views={views}
      />
      <SearchField
        ariaLabel={t('search_aria')}
        clearLabel={t('clear_search')}
        className="w-full sm:w-64"
        onChange={props.onSearchChange}
        placeholder={t('search')}
        value={props.search}
      />
    </div>
  );
}
