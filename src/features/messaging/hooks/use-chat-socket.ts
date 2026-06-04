'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  tryRefreshAccess,
} from '@/lib/api-client';
import { useUser } from '@/lib/auth';

import { Message, MessagesResponse, messageSchema } from '../types';

const RECONNECT_DELAYS = [1000, 3000, 10000];

/**
 * État de la connexion temps réel, exposé à l'UI pour afficher une bannière.
 * - `connecting`  : première tentative d'ouverture du socket
 * - `online`      : socket ouvert, messages en direct
 * - `reconnecting`: le socket a été coupé, nouvelle tentative en cours
 * - `offline`     : aucune connexion (token absent / session expirée)
 */
export type ChatSocketStatus =
  | 'connecting'
  | 'online'
  | 'reconnecting'
  | 'offline';

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
  const [status, setStatus] = useState<ChatSocketStatus>('connecting');

  // Keep latest userId available inside the WS handlers without resubscribing
  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    if (!conversationId) return;

    unmountedRef.current = false;
    attemptRef.current = 0;
    setStatus('connecting');

    const wsBase = resolveWsBase();

    async function connect() {
      if (unmountedRef.current) return;

      // Always connect with a valid, fresh access token
      const token = await getFreshToken();
      // Le composant a pu être démonté pendant l'await → ne touche plus au state.
      if (unmountedRef.current) return;
      if (!token) {
        // No valid token — cannot establish WS; redirect to login
        setStatus('offline');
        clearAccessToken();
        clearRefreshToken();
        const redirectTo = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth/login?redirectTo=${redirectTo}`;
        return;
      }

      const url = `${wsBase}/ws/messaging/conversations/${conversationId}/?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
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
        attemptRef.current = 0;
        setStatus('online');
      };

      ws.onclose = async (event) => {
        if (unmountedRef.current) return;

        const isAuthClose = AUTH_CLOSE_CODES.has(event.code);

        // Sur fermeture auth, on tente un refresh silencieux : statut neutre
        // (`connecting`) plutôt qu'un flash « Reconnexion… » trompeur. Le statut
        // `reconnecting` est réservé aux coupures réseau (close codes non-auth).
        setStatus(isAuthClose ? 'connecting' : 'reconnecting');

        const delay = RECONNECT_DELAYS[attemptRef.current] ?? 10000;
        attemptRef.current = Math.min(
          attemptRef.current + 1,
          RECONNECT_DELAYS.length - 1,
        );

        if (isAuthClose) {
          // Auth rejection from server — try refreshing before reconnecting
          try {
            await tryRefreshAccess();
          } catch {
            // Le composant a pu être démonté pendant l'await.
            if (unmountedRef.current) return;
            // Refresh failed — session dead, redirect to login
            setStatus('offline');
            clearAccessToken();
            clearRefreshToken();
            const redirectTo = encodeURIComponent(window.location.pathname);
            window.location.href = `/auth/login?redirectTo=${redirectTo}`;
            return;
          }
          // Le composant a pu être démonté pendant le refresh réussi.
          if (unmountedRef.current) return;
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

  return { wsRef, status };
}
