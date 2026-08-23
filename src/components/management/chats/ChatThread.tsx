'use client';

import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChatComposer } from '@/components/management/chats/ChatComposer';
import { ChatMessageBubble } from '@/components/management/chats/ChatMessageBubble';
import { Button } from '@/components/ui/button';
import {
  getChatMessages,
  markChatConversationRead,
  sendChatImageMessage,
  sendChatMessage,
} from '@/libs/management/chatAdapter';
import type { ChatRealtimeEvent } from '@/libs/management/useChatRealtime';
import type {
  ChatConversationOutput,
  ChatConversationStateOutput,
  ChatMessageOutput,
} from '@/types/chat';
import { mergeChatMessages } from './chatUtils';

function displayName(conversation: ChatConversationOutput, fallback: string): string {
  const name = `${conversation.user.first_name} ${conversation.user.last_name ?? ''}`.trim();
  return name.length > 0 ? name : (conversation.user.phone ?? fallback);
}

function dateKey(iso: string): string {
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString().slice(0, 10) : iso;
}

function dateLabel(iso: string, locale: string): string {
  const timestamp = Date.parse(iso);
  return Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(timestamp)
    : '';
}

function latestMessageId(messages: ChatMessageOutput[]): number | null {
  let latest: number | null = null;
  for (const message of messages) {
    if (message.id <= 0) {
      continue;
    }
    if (latest === null || message.id > latest) {
      latest = message.id;
    }
  }
  return latest;
}

function ignoreReadReceipt(_targetId: number | null): void {
  return undefined;
}

/**
 * Renders the scrollback states and date-separated message bubbles.
 * @param props - Message state, labels, locale, history, and media callbacks.
 * @returns The scrollback content.
 */
function ThreadMessageList(props: {
  messages: ChatMessageOutput[];
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  locale: string;
  peerLastReadMessageId: number | null;
  loadOlder: () => void;
  loadingLabel: string;
  errorLabel: string;
  emptyLabel: string;
  olderLabel: string;
  onMediaLoad: () => void;
  observeIncoming: (messageId: number) => (element: HTMLDivElement | null) => void;
}) {
  const olderButton = props.hasMore ? (
    <Button
      className="mx-auto shrink-0 rounded-full text-xs"
      disabled={props.loading}
      onClick={props.loadOlder}
      size="sm"
      type="button"
      variant="outline"
    >
      {props.olderLabel}
    </Button>
  ) : null;

  if (props.loading) {
    return (
      <>
        {olderButton}
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {props.loadingLabel}
        </div>
      </>
    );
  }
  if (props.error) {
    return (
      <>
        {olderButton}
        <p className="flex flex-1 items-center justify-center text-sm text-danger">
          {props.errorLabel}
        </p>
      </>
    );
  }
  if (props.messages.length === 0) {
    return (
      <>
        {olderButton}
        <p className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          {props.emptyLabel}
        </p>
      </>
    );
  }

  return (
    <>
      {olderButton}
      {props.messages.map((message, index) => {
        const previous = props.messages.at(index - 1);
        const showDate = !previous || dateKey(previous.created_at) !== dateKey(message.created_at);
        return (
          <div
            className="flex flex-col gap-3"
            key={`${message.id}-${message.client_id ?? 'message'}`}
            ref={message.is_mine ? undefined : props.observeIncoming(message.id)}
          >
            {showDate ? (
              <div className="flex items-center gap-3 py-1 text-[11px] font-medium text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>{dateLabel(message.created_at, props.locale)}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : null}
            <ChatMessageBubble
              message={message}
              onMediaLoad={props.onMediaLoad}
              peerLastReadMessageId={props.peerLastReadMessageId}
            />
          </div>
        );
      })}
    </>
  );
}

/**
 * Renders one conversation thread, including realtime-driven history loading,
 * read receipts, staff actions, and the optimistic reply composer.
 * @param props - Conversation data and management action callbacks.
 * @returns The conversation thread.
 */
export function ChatThread(props: {
  conversation: ChatConversationOutput;
  onBack?: () => void;
  onArchive: () => Promise<void>;
  onUnarchive: () => Promise<void>;
  onBlock: (blocked: boolean) => Promise<void>;
  onDelete: () => void;
  onConversationUpdate: (conversation: ChatConversationOutput) => void;
  onConversationState: (state: ChatConversationStateOutput) => void;
  realtimeEvent: ChatRealtimeEvent | null;
  onTyping: (isTyping: boolean) => void;
}) {
  const t = useTranslations('ChatsPage');
  const locale = useLocale();
  const [messages, setMessages] = useState<ChatMessageOutput[]>([]);
  const [conversationState, setConversationState] = useState<ChatConversationStateOutput | null>(
    null,
  );
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessageOutput[]>(messages);
  const requestTokenRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const lastKnownIdRef = useRef<number | null>(props.conversation.last_message_id);
  const markedReadIdRef = useRef<number | null>(null);
  const optimisticIdRef = useRef(-1);
  const preserveScrollRef = useRef<{ element: HTMLDivElement; height: number } | null>(null);
  const scrollToBottomRef = useRef(false);
  const atBottomRef = useRef(true);
  const markReadRef = useRef<(targetId: number | null) => void>(ignoreReadReceipt);
  const visibilityObserverRef = useRef<IntersectionObserver | null>(null);

  messagesRef.current = messages;
  const conversationId = props.conversation.id;
  const initialLastMessageId = props.conversation.last_message_id;
  const { onConversationState, onConversationUpdate } = props;

  useEffect(() => {
    const root = scrollRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        let highestVisibleId: number | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) {
            continue;
          }
          // SAFETY: only message wrappers receive this observer ref and each
          // wrapper sets data-message-id immediately before observation.
          const id = Number((entry.target as HTMLElement).dataset.messageId);
          if (
            Number.isInteger(id) &&
            id > 0 &&
            (highestVisibleId === null || id > highestVisibleId)
          ) {
            highestVisibleId = id;
          }
        }
        if (document.visibilityState === 'visible') {
          markReadRef.current(highestVisibleId);
        }
      },
      { root, threshold: [0.6] },
    );
    visibilityObserverRef.current = observer;
    return () => {
      observer.disconnect();
      visibilityObserverRef.current = null;
    };
  }, []);

  const observeIncoming = (messageId: number) => (element: HTMLDivElement | null) => {
    if (!element) {
      return;
    }
    element.dataset.messageId = String(messageId);
    visibilityObserverRef.current?.observe(element);
  };

  const handleMediaLoad = useCallback(() => {
    if (atBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    const token = requestTokenRef.current + 1;
    requestTokenRef.current = token;
    requestInFlightRef.current = false;
    lastKnownIdRef.current = initialLastMessageId;
    markedReadIdRef.current = null;
    setMessages([]);
    setConversationState(null);
    setHasMore(false);
    setLoading(true);
    setThreadError(null);

    let active = true;

    const applyState = (nextState: ChatConversationStateOutput) => {
      if (!active || requestTokenRef.current !== token) {
        return;
      }
      setConversationState(nextState);
      onConversationState(nextState);
    };

    const markRead = (targetId: number | null) => {
      if (targetId === null || targetId <= 0 || targetId === markedReadIdRef.current) {
        return;
      }
      markedReadIdRef.current = targetId;
      void markChatConversationRead(conversationId, targetId)
        .then((conversation) => {
          if (active && requestTokenRef.current === token) {
            onConversationUpdate(conversation);
          }
        })
        .catch(() => {
          markedReadIdRef.current = null;
        });
    };
    markReadRef.current = markRead;
    const loadInitial = async () => {
      if (requestInFlightRef.current) {
        return;
      }
      requestInFlightRef.current = true;
      try {
        const response = await getChatMessages(conversationId, { limit: 50 });
        if (!active || requestTokenRef.current !== token) {
          return;
        }
        setMessages(mergeChatMessages([], response.messages));
        setHasMore(response.has_more);
        const latestId = latestMessageId(response.messages);
        lastKnownIdRef.current = latestId;
        applyState(response.conversation);
        scrollToBottomRef.current = true;
        atBottomRef.current = true;
      } catch {
        if (active && requestTokenRef.current === token) {
          setThreadError(t('thread_error'));
        }
      } finally {
        if (requestTokenRef.current === token) {
          requestInFlightRef.current = false;
          setLoading(false);
        }
      }
    };

    void loadInitial();

    return () => {
      active = false;
      markReadRef.current = ignoreReadReceipt;
    };
  }, [conversationId, initialLastMessageId, onConversationState, onConversationUpdate, t]);

  useEffect(() => {
    if (
      props.realtimeEvent === null ||
      props.realtimeEvent.conversation_id !== conversationId ||
      requestInFlightRef.current
    ) {
      return;
    }
    requestInFlightRef.current = true;
    void getChatMessages(conversationId, {
      afterId: lastKnownIdRef.current ?? undefined,
      limit: 50,
    })
      .then((response) => {
        setMessages((current) => mergeChatMessages(current, response.messages));
        const latestId = latestMessageId(response.messages);
        if (
          latestId !== null &&
          (lastKnownIdRef.current === null || latestId > lastKnownIdRef.current)
        ) {
          lastKnownIdRef.current = latestId;
        }
        setConversationState(response.conversation);
        onConversationState(response.conversation);
      })
      .catch(() => {
        // The durable socket cursor requests replay after a reconnect.
      })
      .finally(() => {
        requestInFlightRef.current = false;
      });
  }, [conversationId, onConversationState, props.realtimeEvent]);

  useLayoutEffect(() => {
    if (scrollToBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      scrollToBottomRef.current = false;
    }
    const preserved = preserveScrollRef.current;
    if (preserved && preserved.element === scrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop += scrollRef.current.scrollHeight - preserved.height;
      preserveScrollRef.current = null;
    }
  }, [messages]);

  const loadOlder = async () => {
    const [firstMessage] = messagesRef.current;
    if (!firstMessage || firstMessage.id <= 0 || !hasMore || requestInFlightRef.current) {
      return;
    }
    requestInFlightRef.current = true;
    const element = scrollRef.current;
    preserveScrollRef.current = element ? { element, height: element.scrollHeight } : null;
    try {
      const response = await getChatMessages(conversationId, {
        beforeId: firstMessage.id,
        limit: 50,
      });
      setMessages((current) => mergeChatMessages(response.messages, current));
      setHasMore(response.has_more);
      setConversationState(response.conversation);
      onConversationState(response.conversation);
    } catch {
      preserveScrollRef.current = null;
      setThreadError(t('thread_error'));
    } finally {
      requestInFlightRef.current = false;
    }
  };

  const addOptimisticMessage = (message: ChatMessageOutput) => {
    setMessages((current) => mergeChatMessages(current, [message]));
    atBottomRef.current = true;
    scrollToBottomRef.current = true;
  };

  const sendText = async (text: string, clientId: string) => {
    if (conversationState?.is_read_only || props.conversation.deleted_by_user) {
      return;
    }
    const now = new Date().toISOString();
    const optimisticId = optimisticIdRef.current;
    optimisticIdRef.current -= 1;
    addOptimisticMessage({
      id: optimisticId,
      conversation_id: props.conversation.id,
      sender_id: 0,
      sender_side: 'staff',
      sender_name: t('you'),
      is_mine: true,
      kind: 'text',
      text,
      image_url: null,
      image_width: null,
      image_height: null,
      image_size_bytes: null,
      client_id: clientId,
      read_at: null,
      is_read: false,
      created_at: now,
      updated_at: now,
    });
    setSending(true);
    try {
      const message = await sendChatMessage(props.conversation.id, text, clientId);
      setMessages((current) => mergeChatMessages(current, [message]));
      if (
        message.id > 0 &&
        (lastKnownIdRef.current === null || message.id > lastKnownIdRef.current)
      ) {
        lastKnownIdRef.current = message.id;
      }
    } catch (error) {
      setMessages((current) => current.filter((message) => message.client_id !== clientId));
      throw error;
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (image: File, clientId: string) => {
    if (conversationState?.is_read_only || props.conversation.deleted_by_user) {
      return;
    }
    const imageUrl = URL.createObjectURL(image);
    const now = new Date().toISOString();
    const optimisticId = optimisticIdRef.current;
    optimisticIdRef.current -= 1;
    addOptimisticMessage({
      id: optimisticId,
      conversation_id: props.conversation.id,
      sender_id: 0,
      sender_side: 'staff',
      sender_name: t('you'),
      is_mine: true,
      kind: 'image',
      text: null,
      image_url: imageUrl,
      image_width: null,
      image_height: null,
      image_size_bytes: image.size,
      client_id: clientId,
      read_at: null,
      is_read: false,
      created_at: now,
      updated_at: now,
    });
    setSending(true);
    try {
      const message = await sendChatImageMessage(props.conversation.id, image, clientId);
      setMessages((current) => mergeChatMessages(current, [message]));
      if (
        message.id > 0 &&
        (lastKnownIdRef.current === null || message.id > lastKnownIdRef.current)
      ) {
        lastKnownIdRef.current = message.id;
      }
    } catch (error) {
      setMessages((current) => current.filter((message) => message.client_id !== clientId));
      throw error;
    } finally {
      URL.revokeObjectURL(imageUrl);
      setSending(false);
    }
  };

  const runAction = async (action: () => Promise<void>) => {
    if (actionBusy) {
      return;
    }
    setActionBusy(true);
    try {
      await action();
    } finally {
      setActionBusy(false);
    }
  };

  const state = conversationState;
  const readOnly = state?.is_read_only ?? props.conversation.deleted_by_user;
  const isArchived = state?.is_archived ?? props.conversation.is_archived;
  const isBlocked = state?.is_blocked ?? props.conversation.is_blocked;
  const peerLastReadMessageId =
    state?.peer_last_read_message_id ?? props.conversation.peer_last_read_message_id;
  const name = displayName(props.conversation, t('unknown_user'));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[16px] bg-card">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-3.5 py-3">
        {props.onBack ? (
          <Button
            aria-label={t('back_to_chats')}
            className="size-9 rounded-[10px]"
            onClick={props.onBack}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ArrowLeft className="size-[18px]" />
          </Button>
        ) : null}
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-muted text-muted-foreground">
          {props.conversation.listing.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- listing media comes from the backend host.
            <img
              alt={props.conversation.listing.title}
              className="size-full object-cover"
              src={props.conversation.listing.cover_image_url}
            />
          ) : (
            <CheckCircle2 className="size-5" strokeWidth={1.5} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {props.conversation.listing.title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            aria-label={isArchived ? t('unarchive') : t('archive')}
            className="size-9 rounded-[10px]"
            disabled={actionBusy}
            onClick={() => void runAction(isArchived ? props.onUnarchive : props.onArchive)}
            size="icon"
            title={isArchived ? t('unarchive') : t('archive')}
            type="button"
            variant="ghost"
          >
            {isArchived ? (
              <ArchiveRestore className="size-[17px]" />
            ) : (
              <Archive className="size-[17px]" />
            )}
          </Button>
          <Button
            aria-label={isBlocked ? t('unblock') : t('block')}
            className="size-9 rounded-[10px]"
            disabled={actionBusy}
            onClick={async () => {
              await runAction(async () => {
                await props.onBlock(isBlocked);
              });
            }}
            size="icon"
            title={isBlocked ? t('unblock') : t('block')}
            type="button"
            variant="ghost"
          >
            {isBlocked ? <CheckCircle2 className="size-[17px]" /> : <Ban className="size-[17px]" />}
          </Button>
          <Button
            aria-label={t('delete')}
            className="size-9 rounded-[10px] text-danger hover:text-danger"
            disabled={actionBusy}
            onClick={props.onDelete}
            size="icon"
            title={t('delete')}
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-[17px]" />
          </Button>
        </div>
      </div>

      {readOnly ? (
        <div className="flex shrink-0 items-start gap-2 border-b border-danger/20 bg-danger-subtle/60 px-4 py-3 text-xs text-danger-subtle-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-danger" />
          <span>{t('deleted_banner')}</span>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <div
          className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4"
          onScroll={(event) => {
            const element = event.currentTarget;
            atBottomRef.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <= 64;
          }}
          ref={scrollRef}
        >
          <ThreadMessageList
            emptyLabel={t('no_messages')}
            error={threadError}
            errorLabel={t('thread_error')}
            hasMore={hasMore}
            loadOlder={() => void loadOlder()}
            loading={loading}
            loadingLabel={t('loading_messages')}
            locale={locale}
            messages={messages}
            olderLabel={t('load_older')}
            onMediaLoad={handleMediaLoad}
            observeIncoming={observeIncoming}
            peerLastReadMessageId={peerLastReadMessageId}
          />
        </div>
      </div>

      <ChatComposer
        disabled={readOnly}
        onSendImage={sendImage}
        onSendText={sendText}
        onTyping={props.onTyping}
        sending={sending}
      />
    </div>
  );
}
