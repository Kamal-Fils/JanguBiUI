'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  tryRefreshAccess,
} from '@/lib/api-client';
import { useUser } from '@/lib/auth';

import { Message, MessagesResponse, messageSchema } from '../types';

const RECONNECT_DELAYS = [1000, 3000, 10000];

// WebSocket close codes used by the backend for auth rejection
const AUTH_CLOSE_CODES = new Set([4001, 4003]);

function resolveWsBase(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProto}//${u.host}`;
    } catch {
      // fall through to default
    }
  }
  return 'ws://localhost:8001';
}

async function getFreshToken(): Promise<string | null> {
  let token = getAccessToken();
  if (!token) {
    try {
      await tryRefreshAccess();
      token = getAccessToken();
    } catch {
      return null;
    }
  }
  return token;
}

export function useChatSocket(conversationId: string) {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const currentUserId = user?.id;
  const userIdRef = useRef<string | undefined>(currentUserId);
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  // Keep latest userId available inside the WS handlers without resubscribing
  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!conversationId) return;

    unmountedRef.current = false;
    attemptRef.current = 0;

    const wsBase = resolveWsBase();

    async function connect() {
      if (unmountedRef.current) return;

      // Always connect with a valid, fresh access token
      const token = await getFreshToken();
      if (!token) {
        // No valid token — cannot establish WS; redirect to login
        clearAccessToken();
        clearRefreshToken();
        const redirectTo = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth/login?redirectTo=${redirectTo}`;
        return;
      }

      const url = `${wsBase}/ws/messaging/conversations/${conversationId}/?token=${encodeURIComponent(token)}`;
      console.debug('[chat-ws] connecting', { conversationId });
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        console.debug('[chat-ws] frame received', event.data);
        try {
          const payload = JSON.parse(event.data as string) as {
            type: string;
            message: unknown;
          };
          if (payload.type === 'message.received') {
            const parsed = messageSchema.parse(payload.message);
            const uid = userIdRef.current;
            const msg: Message = {
              ...parsed,
              is_mine: uid ? parsed.sender_id === uid : parsed.is_mine,
            };
            queryClient.setQueryData<MessagesResponse>(
              ['messages', conversationId],
              (old) => {
                if (!old) return { count: 1, results: [msg] };
                const exists = old.results.some((m) => m.id === msg.id);
                if (exists) return old;
                return {
                  count: old.count + 1,
                  results: [...old.results, msg],
                };
              },
            );
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        } catch (err) {
          console.warn('[chat-ws] malformed frame', err);
        }
      };

      ws.onopen = () => {
        console.debug('[chat-ws] open', { conversationId });
        attemptRef.current = 0;
      };

      ws.onclose = async (event) => {
        console.debug('[chat-ws] close', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        if (unmountedRef.current) return;

        const delay = RECONNECT_DELAYS[attemptRef.current] ?? 10000;
        attemptRef.current = Math.min(
          attemptRef.current + 1,
          RECONNECT_DELAYS.length - 1,
        );

        if (AUTH_CLOSE_CODES.has(event.code)) {
          // Auth rejection from server — try refreshing before reconnecting
          try {
            await tryRefreshAccess();
          } catch {
            // Refresh failed — session dead, redirect to login
            clearAccessToken();
            clearRefreshToken();
            const redirectTo = encodeURIComponent(window.location.pathname);
            window.location.href = `/auth/login?redirectTo=${redirectTo}`;
            return;
          }
        }

        timerRef.current = setTimeout(() => void connect(), delay);
      };

      ws.onerror = (event) => {
        console.warn('[chat-ws] error', event);
        ws.close();
      };
    }

    void connect();

    return () => {
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [conversationId, queryClient]);

  return wsRef;
}
