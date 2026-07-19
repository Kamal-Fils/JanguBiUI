import { act, renderHook } from '@testing-library/react';

import { MockWebSocket } from '../../testing/mock-websocket';
import {
  REJECTION_VISIBLE_MS,
  useCommunityRosarySocket,
} from '../use-community-rosary-socket';

const ROSARY_ID = 42;

/**
 * Attend que le socket soit construit (le token est récupéré en async).
 * Le timeout large couvre le premier palier de backoff (1 s) sur reconnexion.
 */
async function waitForSocket(index = 0): Promise<MockWebSocket> {
  await vi.waitFor(
    () => {
      expect(MockWebSocket.instances.length).toBeGreaterThan(index);
    },
    { timeout: 5000 },
  );
  return MockWebSocket.instances[index];
}

function renderSocket(initialDecade = 0) {
  return renderHook(() =>
    useCommunityRosarySocket({ rosaryId: ROSARY_ID, initialDecade }),
  );
}

describe('useCommunityRosarySocket', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    vi.stubGlobal('WebSocket', MockWebSocket);
  });

  test('opens an authenticated socket on the consumer route', async () => {
    const { result } = renderSocket();

    const ws = await waitForSocket();

    // Route déclarée dans apps/rosary/routing.py + token en query param
    // (JwtAuthMiddlewareStack lit ?token=).
    expect(ws.url).toContain(`/ws/rosary/community/${ROSARY_ID}/`);
    expect(ws.url).toContain('token=');

    expect(result.current.status).toBe('connecting');
    act(() => ws.emitOpen());
    expect(result.current.status).toBe('online');
  });

  test('advances the shared progression on a decade_advanced frame', async () => {
    const { result } = renderSocket(0);
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    expect(result.current.currentDecade).toBe(0);

    act(() => ws.emitMessage({ type: 'decade_advanced', current_decade: 3 }));

    expect(result.current.currentDecade).toBe(3);
  });

  test('records an arriving participant and the server count', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    act(() =>
      ws.emitMessage({
        type: 'participant_joined',
        user_email: 'fidele@jangubi.sn',
        participant_count: 4,
      }),
    );

    expect(result.current.participantCount).toBe(4);
    expect(result.current.participants).toEqual(['fidele@jangubi.sn']);

    // Une seconde arrivée du même e-mail ne duplique pas la liste.
    act(() =>
      ws.emitMessage({
        type: 'participant_joined',
        user_email: 'fidele@jangubi.sn',
        participant_count: 4,
      }),
    );
    expect(result.current.participants).toEqual(['fidele@jangubi.sn']);
  });

  test('collects intentions broadcast to the group', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    act(() =>
      ws.emitMessage({
        type: 'intention_submitted',
        text: 'Pour les malades',
        submitted_by: 'pretre@jangubi.sn',
      }),
    );

    expect(result.current.intentions).toHaveLength(1);
    expect(result.current.intentions[0]).toMatchObject({
      text: 'Pour les malades',
      submittedBy: 'pretre@jangubi.sn',
    });
  });

  test('sends the consumer actions as JSON frames', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    act(() => {
      result.current.advance();
    });
    expect(ws.lastSent).toEqual({ action: 'advance' });

    act(() => {
      result.current.submitIntention('  Pour la paix  ');
    });
    expect(ws.lastSent).toEqual({
      action: 'submit_intention',
      text: 'Pour la paix',
    });

    act(() => {
      result.current.end();
    });
    expect(ws.lastSent).toEqual({ action: 'end' });
  });

  test('refuses to send when the socket is closed so the caller can fall back', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    ws.readyState = MockWebSocket.CLOSED;

    let sent = true;
    act(() => {
      sent = result.current.submitIntention('Pour ma famille');
    });

    expect(sent).toBe(false);
    expect(ws.sent).toHaveLength(0);
  });

  test('reconnects after a network drop', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());
    expect(result.current.status).toBe('online');

    // 1006 : coupure réseau — pas un code d'authentification.
    act(() => ws.emitClose(1006));
    expect(result.current.status).toBe('reconnecting');

    // Le premier délai de backoff est de 1 s.
    const reconnected = await waitForSocket(1);
    act(() => reconnected.emitOpen());

    expect(result.current.status).toBe('online');
  });

  test('treats close code 4004 as terminal and does not reconnect', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    // 4004 : session introuvable ou déjà close (consumers.py) — réessayer est vain.
    act(() => ws.emitClose(4004));

    expect(result.current.status).toBe('ended');

    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  test('ends the session on a rosary_ended frame', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    act(() => ws.emitMessage({ type: 'rosary_ended' }));

    expect(result.current.status).toBe('ended');
    expect(ws.closeCalls).toBeGreaterThan(0);
  });

  test('adopts the full participant list from session_state', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    // Avant la trame, le hook ne connaît personne — c'était précisément la
    // limite corrigée : `participant_joined` seul n'annonce que les arrivées
    // POSTÉRIEURES à notre connexion.
    expect(result.current.participants).toEqual([]);

    act(() =>
      ws.emitSessionState({
        participants: [
          { user_email: 'pretre@jangubi.sn', joined_at: '2026-07-19T13:00:00Z' },
          { user_email: 'marie@jangubi.sn', joined_at: '2026-07-19T13:02:00Z' },
        ],
        participant_count: 2,
      }),
    );

    expect(result.current.participants).toEqual([
      'pretre@jangubi.sn',
      'marie@jangubi.sn',
    ]);
    expect(result.current.participantCount).toBe(2);

    // La liste reste cohérente quand une arrivée suit.
    act(() =>
      ws.emitMessage({
        type: 'participant_joined',
        user_email: 'paul@jangubi.sn',
        participant_count: 3,
      }),
    );
    expect(result.current.participants).toHaveLength(3);
  });

  test('lets session_state override the decade inherited from join', async () => {
    // `initialDecade` vient de la réponse REST `join` ; la trame fait autorité.
    const { result } = renderSocket(1);
    const ws = await waitForSocket();
    act(() => ws.emitOpen());
    expect(result.current.currentDecade).toBe(1);

    act(() => ws.emitSessionState({ current_decade: 4 }));

    expect(result.current.currentDecade).toBe(4);
  });

  test('takes the initiator verdict from the server, not from the client', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    // Tant que la trame n'est pas arrivée, le hook ne se prononce pas :
    // l'appelant retombe sur ce qu'il sait (comparaison d'e-mails).
    expect(result.current.isInitiator).toBeNull();

    act(() => ws.emitSessionState({ is_initiator: true }));

    expect(result.current.isInitiator).toBe(true);
  });

  test('surfaces a rejected action then clears it on its own', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    // Minuteur virtuel installé APRÈS l'ouverture : `waitForSocket` a besoin de
    // vraies horloges, l'effacement automatique non.
    vi.useFakeTimers();
    try {
      act(() =>
        ws.emitActionRejected(
          'advance',
          "Seul l'initiateur peut faire avancer le chapelet.",
        ),
      );

      expect(result.current.rejection).toMatchObject({
        action: 'advance',
        reason: "Seul l'initiateur peut faire avancer le chapelet.",
      });

      act(() => {
        vi.advanceTimersByTime(REJECTION_VISIBLE_MS + 100);
      });

      expect(result.current.rejection).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  test('lets the caller dismiss a rejection before it expires', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    act(() => ws.emitActionRejected('end', "Ce chapelet n'est plus actif."));
    expect(result.current.rejection).not.toBeNull();

    act(() => result.current.dismissRejection());

    expect(result.current.rejection).toBeNull();
  });

  test('re-announces a repeated rejection with a fresh identity', async () => {
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    act(() => ws.emitActionRejected('advance', 'Refus.'));
    const first = result.current.rejection?.id;

    act(() => ws.emitActionRejected('advance', 'Refus.'));

    // Même action, même motif : sans identité neuve, l'écran ne pourrait pas
    // re-signaler le refus à un lecteur d'écran.
    expect(result.current.rejection?.id).not.toBe(first);
  });

  test('ignores malformed frames without breaking the session', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderSocket();
    const ws = await waitForSocket();
    act(() => ws.emitOpen());

    act(() => ws.emitRaw('{ not json'));
    act(() => ws.emitMessage({ type: 'unknown_event' }));

    expect(result.current.status).toBe('online');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
