'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { clearSession, tryRefreshAccess } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { getFreshWsToken, resolveWsBase } from '@/lib/ws';

import { Message, MessagesResponse, messageSchema } from '../types';

const RECONNECT_DELAYS = [1000, 3000, 10000];
// Au-delà, on cesse de boucler (« Reconnexion… » infini) : statut `offline`
// + action « Réessayer » exposée via retry().
const MAX_RECONNECT_ATTEMPTS = 8;

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
  const [retryNonce, setRetryNonce] = useState(0);

  /** Relance manuelle après passage en `offline` (plafond de retries atteint). */
  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

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

      // Always connect with a valid, fresh access token (refresh proactif si
      // le token expire dans <30 s — un token périmé en query param = 4001).
      const token = await getFreshWsToken();
      // Le composant a pu être démonté pendant l'await → ne touche plus au state.
      if (unmountedRef.current) return;
      if (!token) {
        // No valid token — cannot establish WS; redirect to login
        setStatus('offline');
        clearSession();
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

        // Plafond de tentatives : sans lui, une origine rejetée (proxy/WS mal
        // configuré) ou un 4003 (non-participant) bouclait « Reconnexion… » à
        // l'infini. Au-delà : hors-ligne + bouton « Réessayer ».
        if (attemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setStatus('offline');
          return;
        }

        // Sur fermeture auth, on tente un refresh silencieux : statut neutre
        // (`connecting`) plutôt qu'un flash « Reconnexion… » trompeur. Le statut
        // `reconnecting` est réservé aux coupures réseau (close codes non-auth).
        setStatus(isAuthClose ? 'connecting' : 'reconnecting');

        const delay =
          RECONNECT_DELAYS[
            Math.min(attemptRef.current, RECONNECT_DELAYS.length - 1)
          ];
        attemptRef.current += 1;

        if (isAuthClose) {
          // Auth rejection from server — try refreshing before reconnecting
          try {
            await tryRefreshAccess();
          } catch {
            // Le composant a pu être démonté pendant l'await.
            if (unmountedRef.current) return;
            // Refresh failed — session dead, redirect to login
            setStatus('offline');
            clearSession();
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
  }, [conversationId, queryClient, retryNonce]);

  return { wsRef, status, retry };
}
