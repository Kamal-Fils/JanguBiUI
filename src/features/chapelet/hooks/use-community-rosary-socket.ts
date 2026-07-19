'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import {
  clearAccessToken,
  clearRefreshToken,
  tryRefreshAccess,
} from '@/lib/api-client';
import { getFreshWsToken, resolveWsBase } from '@/lib/ws';

const RECONNECT_DELAYS = [1000, 3000, 10000];
// Au-delà, on cesse de boucler (« Reconnexion… » infini) : statut `offline`
// + action « Réessayer » exposée via retry(). Même garde-fou que la messagerie.
const MAX_RECONNECT_ATTEMPTS = 8;

/**
 * État de la connexion temps réel au chapelet communautaire.
 * - `connecting`   : première tentative d'ouverture du socket
 * - `online`       : socket ouvert, progression en direct
 * - `reconnecting` : coupure réseau, nouvelle tentative en cours
 * - `offline`      : plus de connexion (token mort ou plafond atteint)
 * - `ended`        : ÉTAT TERMINAL — la session est close (voir plus bas)
 */
export type RosarySocketStatus =
  | 'connecting'
  | 'online'
  | 'reconnecting'
  | 'offline'
  | 'ended';

// 4001 : `connect()` ferme quand `scope["user"]` n'est pas authentifié
// (JwtAuthMiddlewareStack). 4003 n'est pas émis par RosaryConsumer mais reste
// dans l'ensemble « auth » par cohérence avec la messagerie.
const AUTH_CLOSE_CODES = new Set([4001, 4003]);
// 4004 : `connect()` ferme quand la session est introuvable OU que son statut
// n'est plus `active`. Se reconnecter ne peut donc JAMAIS réussir → terminal.
const SESSION_GONE_CODE = 4004;

/** Durée d'affichage d'un refus avant effacement automatique. */
export const REJECTION_VISIBLE_MS = 8000;

/**
 * Trames serveur → client, telles que sérialisées par `RosaryConsumer`
 * (`apps/rosary/consumers.py`). Toute trame hors de cette union est ignorée.
 */
const rosaryEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('participant_joined'),
    user_email: z.string(),
    participant_count: z.number(),
  }),
  z.object({
    type: z.literal('decade_advanced'),
    current_decade: z.number(),
  }),
  z.object({
    type: z.literal('intention_submitted'),
    text: z.string(),
    submitted_by: z.string(),
  }),
  z.object({ type: z.literal('rosary_ended') }),
  // État initial, adressé au SEUL socket qui se connecte, avant le
  // `participant_joined` qui annonce son arrivée au groupe. Il porte ce que le
  // flux temps réel ne pouvait pas reconstituer : la liste NOMINATIVE complète
  // des priants (le socket n'observait que les arrivées postérieures) et la
  // décade autoritaire (jusqu'ici déduite de la réponse REST `join`).
  z.object({
    type: z.literal('session_state'),
    participants: z.array(
      z.object({ user_email: z.string(), joined_at: z.string() }),
    ),
    participant_count: z.number(),
    current_decade: z.number(),
    status: z.string(),
    initiator_email: z.string().nullable(),
    is_initiator: z.boolean(),
  }),
  // Refus explicite, adressé au seul socket concerné. Auparavant `advance` /
  // `end` hors initiateur étaient ignorés EN SILENCE : le client ne distinguait
  // pas « refusé » de « perdu ».
  z.object({
    type: z.literal('action_rejected'),
    action: z.string(),
    reason: z.string(),
  }),
]);

export interface LiveIntention {
  /** Identité locale — le consumer ne renvoie pas d'id sur `intention_submitted`. */
  id: string;
  /**
   * Identité SERVEUR, connue seulement pour les intentions venues de
   * l'historique REST. Sert au dédoublonnage (cf. `utils/merge-intentions`).
   */
  serverId?: number;
  text: string;
  submittedBy: string;
}

export interface RosaryActionRejection {
  /**
   * Numéro d'ordre local. Permet de re-monter le message quand un même refus
   * se répète, donc de le faire ré-annoncer par un lecteur d'écran.
   */
  id: number;
  /** Action refusée : `advance`, `end`, `submit_intention`… */
  action: string;
  /** Motif serveur, déjà rédigé pour l'utilisateur (`ApplicationError.message`). */
  reason: string;
}

interface UseCommunityRosarySocketOptions {
  rosaryId: number;
  /** Décade connue avant le premier événement (issue de `join`). */
  initialDecade: number;
  /** Laisse le socket fermé tant que la session n'est pas rejointe. */
  enabled?: boolean;
}

export interface CommunityRosarySocket {
  status: RosarySocketStatus;
  currentDecade: number;
  participantCount: number;
  /**
   * E-mails de TOUS les participants : la liste complète arrive avec
   * `session_state`, puis `participant_joined` la tient à jour.
   */
  participants: string[];
  intentions: LiveIntention[];
  /**
   * Verdict du SERVEUR sur la qualité d'initiateur (`session_state`).
   * `null` tant que la trame n'est pas arrivée — l'appelant retombe alors sur
   * ce qu'il sait (comparaison d'e-mails), moins sûre.
   */
  isInitiator: boolean | null;
  /** Dernier refus serveur non encore effacé. */
  rejection: RosaryActionRejection | null;
  /** Efface le refus affiché (bouton « masquer »). */
  dismissRejection: () => void;
  /** Passe à la décade suivante — refusé par le serveur hors initiateur. */
  advance: () => boolean;
  /** Diffuse une intention. `false` si le socket est fermé → repli REST. */
  submitIntention: (text: string) => boolean;
  /** Clôt la session pour tout le monde — initiateur uniquement côté serveur. */
  end: () => boolean;
  /** Relance après passage en `offline`. */
  retry: () => void;
}

export function useCommunityRosarySocket({
  rosaryId,
  initialDecade,
  enabled = true,
}: UseCommunityRosarySocketOptions): CommunityRosarySocket {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  // Verrou terminal : empêche toute reconnexion après une fin de session.
  const endedRef = useRef(false);
  const intentionSeqRef = useRef(0);
  const rejectionSeqRef = useRef(0);
  const initialDecadeRef = useRef(initialDecade);

  const [status, setStatus] = useState<RosarySocketStatus>('connecting');
  const [currentDecade, setCurrentDecade] = useState(initialDecade);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState<string[]>([]);
  const [intentions, setIntentions] = useState<LiveIntention[]>([]);
  const [isInitiator, setIsInitiator] = useState<boolean | null>(null);
  const [rejection, setRejection] = useState<RosaryActionRejection | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);
  const dismissRejection = useCallback(() => setRejection(null), []);

  // Un refus est une information ponctuelle : il s'efface seul pour ne pas
  // encombrer l'écran de prière, et l'utilisateur peut le masquer plus tôt.
  // Chaque refus étant un objet neuf, le minuteur repart à chaque occurrence.
  useEffect(() => {
    if (!rejection) return;
    const timer = setTimeout(() => setRejection(null), REJECTION_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [rejection]);

  useEffect(() => {
    initialDecadeRef.current = initialDecade;
  }, [initialDecade]);

  // Changement de session — ou passage de `enabled` à vrai une fois `join`
  // résolu — → ardoise vierge amorcée sur la décade AUTORITAIRE du serveur.
  // Déclaré AVANT l'effet de connexion pour précéder l'ouverture du socket.
  useEffect(() => {
    endedRef.current = false;
    setCurrentDecade(initialDecadeRef.current);
    setParticipantCount(0);
    setParticipants([]);
    setIntentions([]);
    // `session_state` de la nouvelle session tranchera : d'ici là, on ne sait pas.
    setIsInitiator(null);
    setRejection(null);
  }, [rosaryId, enabled]);

  useEffect(() => {
    if (!rosaryId || !enabled) return;

    unmountedRef.current = false;
    attemptRef.current = 0;
    setStatus('connecting');

    const wsBase = resolveWsBase();

    async function connect() {
      if (unmountedRef.current || endedRef.current) return;

      // Token frais obligatoire : un access token périmé passé en query param
      // se traduit par un close 4001 côté middleware.
      const token = await getFreshWsToken();
      if (unmountedRef.current) return;
      if (!token) {
        setStatus('offline');
        clearAccessToken();
        clearRefreshToken();
        const redirectTo = encodeURIComponent(window.location.pathname);
        window.location.href = `/auth/login?redirectTo=${redirectTo}`;
        return;
      }

      const url = `${wsBase}/ws/rosary/community/${rosaryId}/?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const frame = rosaryEventSchema.parse(
            JSON.parse(event.data as string),
          );

          switch (frame.type) {
            case 'session_state':
              // Le serveur fait autorité sur les trois : la liste nominative
              // (le socket ne voyait que les arrivées postérieures), la décade
              // (jusqu'ici déduite de `join`) et la qualité d'initiateur.
              setParticipants(frame.participants.map((p) => p.user_email));
              setParticipantCount(frame.participant_count);
              setCurrentDecade(frame.current_decade);
              setIsInitiator(frame.is_initiator);
              break;
            case 'action_rejected':
              rejectionSeqRef.current += 1;
              setRejection({
                id: rejectionSeqRef.current,
                action: frame.action,
                reason: frame.reason,
              });
              break;
            case 'participant_joined':
              setParticipantCount(frame.participant_count);
              setParticipants((prev) =>
                prev.includes(frame.user_email)
                  ? prev
                  : [...prev, frame.user_email],
              );
              break;
            case 'decade_advanced':
              setCurrentDecade(frame.current_decade);
              break;
            case 'intention_submitted':
              intentionSeqRef.current += 1;
              setIntentions((prev) => [
                ...prev,
                {
                  id: `live-intention-${intentionSeqRef.current}`,
                  text: frame.text,
                  submittedBy: frame.submitted_by,
                },
              ]);
              break;
            case 'rosary_ended':
              // Fin normale : on verrouille avant de fermer pour que `onclose`
              // ne relance pas une reconnexion.
              endedRef.current = true;
              setStatus('ended');
              ws.close();
              break;
          }
        } catch (err) {
          console.warn('[rosary-ws] trame invalide', err);
        }
      };

      ws.onopen = () => {
        attemptRef.current = 0;
        setStatus('online');
      };

      ws.onclose = async (event) => {
        if (unmountedRef.current || endedRef.current) return;

        // Session absente ou déjà close côté serveur : réessayer est vain.
        if (event.code === SESSION_GONE_CODE) {
          endedRef.current = true;
          setStatus('ended');
          return;
        }

        if (attemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setStatus('offline');
          return;
        }

        const isAuthClose = AUTH_CLOSE_CODES.has(event.code);
        // Sur fermeture auth on tente un refresh silencieux : statut neutre
        // (`connecting`) plutôt qu'un « Reconnexion… » trompeur.
        setStatus(isAuthClose ? 'connecting' : 'reconnecting');

        const delay =
          RECONNECT_DELAYS[
            Math.min(attemptRef.current, RECONNECT_DELAYS.length - 1)
          ];
        attemptRef.current += 1;

        if (isAuthClose) {
          try {
            await tryRefreshAccess();
          } catch {
            if (unmountedRef.current) return;
            setStatus('offline');
            clearAccessToken();
            clearRefreshToken();
            const redirectTo = encodeURIComponent(window.location.pathname);
            window.location.href = `/auth/login?redirectTo=${redirectTo}`;
            return;
          }
          if (unmountedRef.current || endedRef.current) return;
        }

        timerRef.current = setTimeout(() => void connect(), delay);
      };

      ws.onerror = () => {
        // Le close qui suit porte le diagnostic (code) — on ferme et on laisse
        // `onclose` décider de la reconnexion.
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
  }, [rosaryId, enabled, retryNonce]);

  const send = useCallback((payload: Record<string, unknown>): boolean => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }, []);

  const advance = useCallback(() => send({ action: 'advance' }), [send]);

  const submitIntention = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      return send({ action: 'submit_intention', text: trimmed });
    },
    [send],
  );

  const end = useCallback(() => send({ action: 'end' }), [send]);

  return {
    status,
    currentDecade,
    participantCount,
    participants,
    intentions,
    isInitiator,
    rejection,
    dismissRejection,
    advance,
    submitIntention,
    end,
    retry,
  };
}
