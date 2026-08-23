'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

const chatRealtimeEventSchema = z.object({
  type: z.string(),
  event_id: z.number().int().nonnegative().optional(),
  conversation_id: z.number().int().positive().optional(),
  conversation_version: z.number().int().nonnegative().optional(),
  data: z.looseObject({}).optional(),
});

export type ChatRealtimeEvent = z.infer<typeof chatRealtimeEventSchema>;

type ChatRealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export type ChatRealtimeConnection = {
  status: ChatRealtimeStatus;
  setTyping: (conversationId: number, isTyping: boolean) => void;
};

function websocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/v1/chat/`;
}

/**
 * Maintains the management chat WebSocket and replays missed durable events.
 * @param onEvent - Receives each validated server event exactly once per socket cursor.
 * @returns The current connection status for subtle UI feedback.
 */
export function useChatRealtime(
  onEvent: (event: ChatRealtimeEvent) => void,
): ChatRealtimeConnection {
  const onEventRef = useRef(onEvent);
  const cursorRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const [status, setStatus] = useState<ChatRealtimeStatus>('connecting');

  onEventRef.current = onEvent;

  const setTyping = useCallback((conversationId: number, isTyping: boolean) => {
    const socket = socketRef.current;
    if (socket?.readyState !== WebSocket.OPEN) {
      return;
    }
    socket.send(
      JSON.stringify({
        type: 'chat.typing.set',
        conversation_id: conversationId,
        is_typing: isTyping,
      }),
    );
  }, []);

  useEffect(() => {
    let disposed = false;
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const clearReconnect = () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    function connect(): void {
      if (disposed || document.visibilityState === 'hidden') {
        return;
      }
      clearReconnect();
      setStatus(attemptsRef.current === 0 ? 'connecting' : 'reconnecting');
      const socket = new WebSocket(websocketUrl());
      socketRef.current = socket;
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ type: 'chat.sync', after_event_id: cursorRef.current }));
      });
      socket.addEventListener('message', (message) => {
        let parsed: unknown;
        try {
          parsed = JSON.parse(String(message.data));
        } catch {
          return;
        }
        const result = chatRealtimeEventSchema.safeParse(parsed);
        if (!result.success) {
          return;
        }
        const event = result.data;
        if (event.type === 'chat.ready') {
          attemptsRef.current = 0;
          setStatus('connected');
          heartbeat ??= setInterval(() => {
            if (socket.readyState === WebSocket.OPEN && document.visibilityState === 'visible') {
              socket.send(JSON.stringify({ type: 'chat.ping', last_event_id: cursorRef.current }));
            }
          }, 25 * 1000);
          return;
        }
        if (event.type === 'chat.resync_required') {
          cursorRef.current = 0;
          onEventRef.current(event);
          return;
        }
        if (event.event_id !== undefined) {
          if (event.event_id <= cursorRef.current) {
            return;
          }
          cursorRef.current = event.event_id;
        }
        if (event.type !== 'chat.pong' && event.type !== 'chat.error') {
          onEventRef.current(event);
        }
      });
      socket.addEventListener('close', () => {
        if (heartbeat !== null) {
          clearInterval(heartbeat);
          heartbeat = null;
        }
        if (!disposed && reconnectTimerRef.current === null) {
          attemptsRef.current += 1;
          const cap = Math.min(30 * 1000, 1000 * 2 ** Math.min(attemptsRef.current, 5));
          const delay = Math.round(cap * (0.5 + Math.random() * 0.5));
          setStatus('reconnecting');
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            connect();
          }, delay);
        }
      });
      socket.addEventListener('error', () => {
        socket.close();
      });
    }

    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        socketRef.current?.readyState !== WebSocket.OPEN
      ) {
        connect();
      }
    };

    connect();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      disposed = true;
      clearReconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (heartbeat !== null) {
        clearInterval(heartbeat);
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  return { status, setTyping };
}
