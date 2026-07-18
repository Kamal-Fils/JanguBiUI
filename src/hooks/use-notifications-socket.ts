'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useUser } from '@/lib/auth';
import { getFreshWsToken, resolveWsBase } from '@/lib/ws';

const RECONNECT_DELAYS = [1000, 5000, 15000, 30000];
// Au-delà, on abandonne SILENCIEUSEMENT : le poll 30 s des queries reste le
// fallback — pas de bannière, ce socket est une optimisation temps réel.
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Socket temps réel GLOBAL — `/ws/notifications/` (groupe backend `user_{id}`).
 *
 * Le backend y pousse `new_message` (et les autres événements de notification)
 * pour CHAQUE message reçu, y compris dans une conversation que l'utilisateur
 * n'a jamais ouverte. Sans cette connexion, une conversation entrante ne
 * devenait visible qu'au prochain poll de 30 s — vécu comme « le message
 * n'apparaît jamais ». Monté une seule fois dans le shell de l'app.
 */
export function useNotificationsSocket() {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const userId = user?.id;

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    stoppedRef.current = false;
    attemptRef.current = 0;
    const wsBase = resolveWsBase();

    async function connect() {
      if (stoppedRef.current) return;

      const token = await getFreshWsToken();
      if (stoppedRef.current || !token) return;

      const ws = new WebSocket(
        `${wsBase}/ws/notifications/?token=${encodeURIComponent(token)}`,
      );
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data as string) as {
            event_type?: string;
          };
          if (frame.event_type === 'new_message') {
            void queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
          void queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch {
          // frame illisible — ignorée
        }
      };

      ws.onclose = () => {
        if (stoppedRef.current) return;
        if (attemptRef.current >= MAX_RECONNECT_ATTEMPTS) return;
        const delay =
          RECONNECT_DELAYS[
            Math.min(attemptRef.current, RECONNECT_DELAYS.length - 1)
          ];
        attemptRef.current += 1;
        timerRef.current = setTimeout(() => void connect(), delay);
      };

      ws.onerror = () => ws.close();
    }

    void connect();

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [userId, queryClient]);
}
