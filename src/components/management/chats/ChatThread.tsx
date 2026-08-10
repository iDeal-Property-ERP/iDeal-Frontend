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
import { useEffect, useRef, useState } from 'react';
import { ChatComposer } from '@/components/management/chats/ChatComposer';
import { ChatMessageBubble } from '@/components/management/chats/ChatMessageBubble';
import { Button } from '@/components/ui/button';
import {
  getChatMessages,
  markChatConversationRead,
  sendChatImageMessage,
  sendChatMessage,
} from '@/libs/management/chatAdapter';
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

/**
 * Renders the scrollback states and date-separated message bubbles.
 * @param props - Message state, labels, locale, and history callback.
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
              peerLastReadMessageId={props.peerLastReadMessageId}
            />
          </div>
        );
      })}
    </>
  );
}

/**
 * Renders one conversation thread, including guarded polling, history loading,
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

  messagesRef.current = messages;
  const conversationId = props.conversation.id;
  const initialLastMessageId = props.conversation.last_message_id;
  const { onConversationState, onConversationUpdate } = props;

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
    let timer: ReturnType<typeof setInterval> | null = null;

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
        markRead(latestId);
        scrollToBottomRef.current = true;
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

    const poll = async () => {
      if (
        !active ||
        requestTokenRef.current !== token ||
        document.visibilityState !== 'visible' ||
        requestInFlightRef.current
      ) {
        return;
      }
      requestInFlightRef.current = true;
      try {
        const response = await getChatMessages(conversationId, {
          afterId: lastKnownIdRef.current ?? undefined,
          limit: 50,
        });
        if (!active || requestTokenRef.current !== token) {
          return;
        }
        if (response.messages.length > 0) {
          setMessages((current) => mergeChatMessages(current, response.messages));
          scrollToBottomRef.current = true;
          const latestId = latestMessageId(response.messages);
          if (
            latestId !== null &&
            (lastKnownIdRef.current === null || latestId > lastKnownIdRef.current)
          ) {
            lastKnownIdRef.current = latestId;
          }
          markRead(lastKnownIdRef.current);
        }
        applyState(response.conversation);
      } catch {
        // Polling is best effort; the visible thread remains usable.
      } finally {
        if (requestTokenRef.current === token) {
          requestInFlightRef.current = false;
        }
      }
    };

    const stopTimer = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const startTimer = () => {
      if (timer === null && document.visibilityState === 'visible') {
        timer = setInterval(() => void poll(), 2000);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopTimer();
        return;
      }
      startTimer();
      void poll();
    };

    void loadInitial();
    document.addEventListener('visibilitychange', onVisibilityChange);
    startTimer();

    return () => {
      active = false;
      stopTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [conversationId, initialLastMessageId, onConversationState, onConversationUpdate, t]);

  useEffect(() => {
    if (scrollToBottomRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      scrollToBottomRef.current = false;
    }
    const preserved = preserveScrollRef.current;
    if (preserved && preserved.element === scrollRef.current && scrollRef.current) {
      scrollRef.current.scrollTop += scrollRef.current.scrollHeight - preserved.height;
      preserveScrollRef.current = null;
    }
  }, [messages.length]);

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
    <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-[16px] bg-card">
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
        <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4" ref={scrollRef}>
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
            peerLastReadMessageId={peerLastReadMessageId}
          />
        </div>
      </div>

      <ChatComposer
        disabled={readOnly}
        onSendImage={sendImage}
        onSendText={sendText}
        sending={sending}
      />
    </div>
  );
}
