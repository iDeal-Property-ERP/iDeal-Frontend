'use client';

import { LoaderCircle, MessagesSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ChatFilters } from '@/components/management/chats/ChatFilters';
import { ChatsList } from '@/components/management/chats/ChatsList';
import { ChatThread } from '@/components/management/chats/ChatThread';
import { DangerConfirmDialog } from '@/components/management/dialogs/DangerConfirmDialog';
import { ManagementPageHeader } from '@/components/management/ManagementPageHeader';
import { EmptyState } from '@/components/management/states/EmptyState';
import { ErrorState } from '@/components/management/states/ErrorState';
import { TriageShell } from '@/components/management/triage/TriageShell';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  archiveChatConversation,
  blockChatConversation,
  listChatConversations,
  purgeChatConversation,
  unarchiveChatConversation,
  unblockChatConversation,
} from '@/libs/management/chatAdapter';
import { useChatRealtime } from '@/libs/management/useChatRealtime';
import type { ChatRealtimeEvent } from '@/libs/management/useChatRealtime';
import type { ChatConversationOutput, ChatConversationStateOutput, ChatStatus } from '@/types/chat';

/**
 * Management shared-inbox page for listing-scoped mobile conversations.
 * @returns The responsive chat triage surface.
 */
export default function ManagementChatsPage() {
  const t = useTranslations('ChatsPage');
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<ChatStatus>('open');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<ChatConversationOutput[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChatConversationOutput | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [latestRealtimeEvent, setLatestRealtimeEvent] = useState<ChatRealtimeEvent | null>(null);
  const listRequestInFlightRef = useRef(false);

  const loadList = useCallback(
    async (silent = false) => {
      if (listRequestInFlightRef.current) {
        return;
      }
      listRequestInFlightRef.current = true;
      if (!silent) {
        setListLoading(true);
      }
      setListError(null);
      try {
        const result = await listChatConversations({
          page: 1,
          perPage: 50,
          search: search || undefined,
          status,
        });
        setConversations(result.items);
        setTotal(result.total);
      } catch {
        setListError(t('error'));
      } finally {
        listRequestInFlightRef.current = false;
        if (!silent) {
          setListLoading(false);
        }
      }
    },
    [search, status, t],
  );

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const chatRealtime = useChatRealtime(
    useCallback(
      (event: ChatRealtimeEvent) => {
        setLatestRealtimeEvent(event);
        // The socket is the change signal; REST remains the authoritative
        // serializer for filtered/paginated inbox rows.
        void loadList(true);
      },
      [loadList],
    ),
  );

  useEffect(() => {
    if (
      selectedId !== null &&
      !conversations.some((conversation) => conversation.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [conversations, selectedId]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const replaceConversation = useCallback((next: ChatConversationOutput) => {
    setConversations((current) =>
      current.map((conversation) => (conversation.id === next.id ? next : conversation)),
    );
  }, []);

  const applyConversationState = useCallback((state: ChatConversationStateOutput) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === state.id
          ? {
              ...conversation,
              deleted_by_user: state.deleted_by_user,
              is_read_only: state.is_read_only,
              is_blocked: state.is_blocked,
              is_archived: state.is_archived,
              is_muted: state.is_muted,
              unread_count: state.unread_count,
              staff_unread_count: state.unread_count,
              last_message_id: state.last_message_id,
              staff_last_read_message_id: state.staff_last_read_message_id,
              peer_last_read_message_id: state.peer_last_read_message_id,
              listing_is_available: state.listing_is_available,
            }
          : conversation,
      ),
    );
  }, []);

  const mutateConversation = useCallback(
    async (mutation: () => Promise<ChatConversationOutput>) => {
      try {
        const updated = await mutation();
        replaceConversation(updated);
        await loadList(true);
      } catch {
        toast.error(t('action_failed'));
      }
    },
    [loadList, replaceConversation, t],
  );

  const requestDelete = (conversation: ChatConversationOutput) => {
    setDeleteTarget(conversation);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleteBusy(true);
    try {
      await purgeChatConversation(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedId(null);
      await loadList(true);
    } catch {
      toast.error(t('action_failed'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const changeStatus = (next: ChatStatus) => {
    setSelectedId(null);
    setStatus(next);
  };

  const changeSearch = (next: string) => {
    setSelectedId(null);
    setSearch(next);
  };

  if (listError && conversations.length === 0) {
    return (
      <ErrorState
        message={listError}
        onRetry={() => void loadList()}
        retryLabel={t('retry')}
        title={t('error')}
      />
    );
  }

  let rail: React.ReactNode;
  if (listLoading && conversations.length === 0) {
    rail = (
      <div className="flex items-center justify-center gap-2 px-1 py-10 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        {t('loading')}
      </div>
    );
  } else if (conversations.length === 0) {
    rail = <p className="px-1 py-10 text-center text-sm text-muted-foreground">{t('empty')}</p>;
  } else {
    rail = (
      <ChatsList
        conversations={conversations}
        onSelect={(conversation) => setSelectedId(conversation.id)}
        selectedId={selectedId}
      />
    );
  }

  let thread: React.ReactNode;
  if (selected) {
    const archive = async () => {
      await mutateConversation(async () => await archiveChatConversation(selected.id));
    };
    const unarchive = async () => {
      await mutateConversation(async () => await unarchiveChatConversation(selected.id));
    };
    const toggleBlock = async (blocked: boolean) => {
      if (blocked) {
        await mutateConversation(async () => await unblockChatConversation(selected.id));
        return;
      }
      await mutateConversation(async () => await blockChatConversation(selected.id));
    };
    thread = (
      <ChatThread
        conversation={selected}
        onArchive={archive}
        onBack={isMobile ? () => setSelectedId(null) : undefined}
        onBlock={toggleBlock}
        onConversationState={applyConversationState}
        onConversationUpdate={replaceConversation}
        onTyping={(isTyping) => chatRealtime.setTyping(selected.id, isTyping)}
        realtimeEvent={latestRealtimeEvent}
        onDelete={() => requestDelete(selected)}
        onUnarchive={unarchive}
      />
    );
  } else {
    thread = (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          description={t('select_prompt')}
          icon={MessagesSquare}
          title={t('select_prompt_title')}
          tone="muted"
        />
      </div>
    );
  }

  const filters = (
    <ChatFilters
      onSearchChange={changeSearch}
      onStatusChange={changeStatus}
      search={search}
      status={status}
    />
  );

  const mobileContent: React.ReactNode = selected ? (
    <div className="fixed inset-0 z-40 h-[100dvh] bg-background">{thread}</div>
  ) : (
    <div className="flex flex-col gap-4 p-4">
      <ManagementPageHeader
        showBell={false}
        subtitle={t('subtitle', { count: total })}
        title={t('title')}
      />
      {filters}
      {rail}
    </div>
  );

  return (
    <>
      {isMobile ? (
        mobileContent
      ) : (
        <TriageShell
          detail={thread}
          header={
            <ManagementPageHeader
              showBell={false}
              subtitle={t('subtitle', { count: total })}
              title={t('title')}
            />
          }
          rail={rail}
          tabs={filters}
        />
      )}
      <DangerConfirmDialog
        cancelLabel={t('cancel')}
        consequences={[t('delete_consequence_messages'), t('delete_consequence_both')]}
        confirmLabel={t('delete_confirm')}
        confirmPhrase={t('delete_confirm_phrase')}
        description={t('delete_description')}
        loading={deleteBusy}
        onConfirm={() => void confirmDelete()}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) {
            setDeleteTarget(null);
          }
        }}
        open={deleteTarget !== null}
        title={t('delete_title')}
        typeLabel={t('delete_confirm_phrase_label')}
      />
    </>
  );
}
