import { act, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { createClergyUser, createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, userEvent } from '@/testing/test-utils';

import type { CommunityRosary } from '../../api/get-community-rosaries';
import { MockWebSocket } from '../../testing/mock-websocket';
import { LiveRosarySession } from '../live-rosary-session';

const ROSARY_ID = 12;
const INITIATOR_EMAIL = 'pretre@jangubi.sn';
const BASE = `${env.API_URL}/v1/rosary/community/${ROSARY_ID}`;

const rosary: CommunityRosary = {
  id: ROSARY_ID,
  initiator_email: INITIATOR_EMAIL,
  mystery_group_name: 'Mystères Joyeux',
  intention: 'Pour la paix au Sénégal',
  status: 'active',
  current_decade: 0,
  started_at: new Date().toISOString(),
};

/** Handler `join` par défaut — renvoie l'état autoritaire de la session. */
function mockJoin(overrides: Partial<CommunityRosary> = {}) {
  return http.post(`${BASE}/join/`, () =>
    HttpResponse.json({ ...rosary, ...overrides }),
  );
}

type HistoryIntention = {
  id: number;
  text: string;
  submitted_by: string | null;
  created_at: string;
};

/**
 * Handler `GET .../intentions/` — historique paginé (enveloppe
 * `LimitOffsetPagination`). Enregistré par défaut : chaque montage de la
 * session le sollicite, et le serveur MSW rejette toute requête non gérée.
 */
function mockIntentionsHistory(results: HistoryIntention[] = []) {
  return http.get(`${BASE}/intentions/`, () =>
    HttpResponse.json({
      limit: 50,
      offset: 0,
      count: results.length,
      next: null,
      previous: null,
      results,
    }),
  );
}

function historyIntention(
  id: number,
  text: string,
  submittedBy: string,
): HistoryIntention {
  return {
    id,
    text,
    submitted_by: submittedBy,
    created_at: new Date().toISOString(),
  };
}

/** Connecte l'utilisateur en tant qu'initiateur de la session. */
function mockInitiatorUser() {
  return http.get(`${env.API_URL}/v1/auth/me/`, () =>
    HttpResponse.json(createClergyUser('pretre', { email: INITIATOR_EMAIL })),
  );
}

async function waitForSocket(index = 0): Promise<MockWebSocket> {
  await vi.waitFor(
    () => {
      expect(MockWebSocket.instances.length).toBeGreaterThan(index);
    },
    { timeout: 5000 },
  );
  return MockWebSocket.instances[index];
}

/** Ouvre le socket et rend la session « en direct ». */
async function openSocket(): Promise<MockWebSocket> {
  const ws = await waitForSocket();
  act(() => ws.emitOpen());
  return ws;
}

describe('LiveRosarySession', () => {
  beforeEach(() => {
    MockWebSocket.reset();
    vi.stubGlobal('WebSocket', MockWebSocket);
    // Historique vide par défaut ; les tests qui l'éprouvent le surchargent.
    server.use(mockIntentionsHistory());
  });

  test('joins the session then shows the live progression', async () => {
    server.use(mockJoin({ current_decade: 2 }));

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);

    // Pendant le join : rien de la session en direct n'est encore affiché.
    expect(screen.queryByText('Mystères Joyeux')).not.toBeInTheDocument();

    expect(await screen.findByText('Mystères Joyeux')).toBeInTheDocument();
    expect(screen.getByText('Pour la paix au Sénégal')).toBeInTheDocument();
    // La décade vient du serveur, pas de l'objet de la liste.
    expect(screen.getByText('Décade 2')).toBeInTheDocument();
  });

  test('shows a recoverable error when joining fails, then recovers on retry', async () => {
    let calls = 0;
    server.use(
      http.post(`${BASE}/join/`, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { detail: "Ce chapelet n'est plus actif." },
            { status: 400 },
          );
        }
        return HttpResponse.json(rosary);
      }),
    );

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);

    expect(
      await screen.findByText(/impossible de rejoindre ce chapelet/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(await screen.findByText('Mystères Joyeux')).toBeInTheDocument();
  });

  test('reflects a decade advanced by the initiator in real time', async () => {
    server.use(mockJoin());

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    // `current_decade` part de 0 côté modèle : la session s'ouvre avant la 1ʳᵉ dizaine.
    expect(screen.getByText('Ouverture')).toBeInTheDocument();

    const ws = await openSocket();
    act(() => ws.emitMessage({ type: 'decade_advanced', current_decade: 3 }));

    expect(await screen.findByText('Décade 3')).toBeInTheDocument();
  });

  test('shows a participant arriving in the session', async () => {
    server.use(mockJoin());

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    act(() =>
      ws.emitMessage({
        type: 'participant_joined',
        user_email: 'marie@jangubi.sn',
        participant_count: 3,
      }),
    );

    expect(await screen.findByText('3 participants')).toBeInTheDocument();
    expect(screen.getByText('marie@jangubi.sn')).toBeInTheDocument();
  });

  test('displays intentions broadcast by other participants', async () => {
    server.use(mockJoin());

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    act(() =>
      ws.emitMessage({
        type: 'intention_submitted',
        text: 'Pour les vocations',
        submitted_by: 'diacre@jangubi.sn',
      }),
    );

    expect(await screen.findByText('Pour les vocations')).toBeInTheDocument();
  });

  test('sends a submitted intention over the socket when it is open', async () => {
    server.use(mockJoin());

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    await userEvent.type(
      screen.getByLabelText(/confier une intention/i),
      'Pour ma famille',
    );
    await userEvent.click(screen.getByRole('button', { name: /confier/i }));

    expect(ws.lastSent).toEqual({
      action: 'submit_intention',
      text: 'Pour ma famille',
    });
  });

  test('falls back to the REST endpoint when the socket is closed', async () => {
    const bodies: unknown[] = [];
    server.use(
      mockJoin(),
      http.post(`${BASE}/intentions/`, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, {
          status: 201,
          headers: { 'content-length': '0' },
        });
      }),
    );

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    // Socket coupé : l'intention doit tout de même être enregistrée.
    ws.readyState = MockWebSocket.CLOSED;

    await userEvent.type(
      screen.getByLabelText(/confier une intention/i),
      'Pour les malades',
    );
    await userEvent.click(screen.getByRole('button', { name: /confier/i }));

    await vi.waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ text: 'Pour les malades' });
    expect(ws.sent).toHaveLength(0);
  });

  test('does not expose the initiator controls to a participating fidèle', async () => {
    server.use(
      mockJoin(),
      http.get(`${env.API_URL}/v1/auth/me/`, () =>
        HttpResponse.json(createUser({ email: 'fidele@jangubi.sn' })),
      ),
    );

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');

    expect(
      screen.queryByRole('button', { name: /décade suivante/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /terminer le chapelet/i }),
    ).not.toBeInTheDocument();
  });

  test('lets the initiator advance the decade over the socket', async () => {
    server.use(mockJoin(), mockInitiatorUser());

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    const advance = await screen.findByRole('button', {
      name: /décade suivante/i,
    });
    await userEvent.click(advance);

    expect(ws.lastSent).toEqual({ action: 'advance' });
  });

  test('shows the intentions deposited before the user joined', async () => {
    server.use(
      mockJoin(),
      mockIntentionsHistory([
        historyIntention(1, 'Pour les malades', 'marie@jangubi.sn'),
        historyIntention(2, 'Pour les vocations', 'diacre@jangubi.sn'),
      ]),
    );

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');

    // Avant cet historique, un fidèle rejoignant en cours de chapelet lisait
    // « Aucune intention confiée » alors que la communauté priait déjà.
    expect(await screen.findByText('Pour les malades')).toBeInTheDocument();
    expect(screen.getByText('Pour les vocations')).toBeInTheDocument();
  });

  test('merges the history with the live flow without duplicating an intention', async () => {
    // Déposée juste avant l'ouverture du socket : elle arrive par les DEUX
    // chemins — une fois dans l'historique, une fois en direct.
    server.use(
      mockJoin(),
      mockIntentionsHistory([
        historyIntention(9, 'Pour la paix', 'paul@jangubi.sn'),
      ]),
    );

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    await screen.findByText('Pour la paix');

    const ws = await openSocket();
    act(() =>
      ws.emitMessage({
        type: 'intention_submitted',
        text: 'Pour la paix',
        submitted_by: 'paul@jangubi.sn',
      }),
    );

    expect(screen.getAllByText('Pour la paix')).toHaveLength(1);

    // Une intention réellement nouvelle s'ajoute normalement.
    act(() =>
      ws.emitMessage({
        type: 'intention_submitted',
        text: 'Pour les catéchumènes',
        submitted_by: 'marie@jangubi.sn',
      }),
    );
    expect(
      await screen.findByText('Pour les catéchumènes'),
    ).toBeInTheDocument();
  });

  test('keeps praying when the intentions history is forbidden', async () => {
    // 403 : le serveur réserve la lecture aux participants et à l'initiateur.
    server.use(
      mockJoin(),
      http.get(`${BASE}/intentions/`, () =>
        HttpResponse.json(
          { detail: 'Vous ne participez pas à ce chapelet.' },
          { status: 403 },
        ),
      ),
    );

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    // Aucun écran d'erreur : l'absence d'historique n'est pas une panne.
    expect(
      screen.queryByText(/impossible de rejoindre ce chapelet/i),
    ).not.toBeInTheDocument();

    act(() =>
      ws.emitMessage({
        type: 'intention_submitted',
        text: 'Pour ma famille',
        submitted_by: 'marie@jangubi.sn',
      }),
    );

    expect(await screen.findByText('Pour ma famille')).toBeInTheDocument();
  });

  test('lists every participant from the session state, not only later arrivals', async () => {
    server.use(mockJoin());

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    act(() =>
      ws.emitSessionState({
        participants: [
          { user_email: INITIATOR_EMAIL, joined_at: '2026-07-19T13:00:00Z' },
          { user_email: 'marie@jangubi.sn', joined_at: '2026-07-19T13:04:00Z' },
        ],
        participant_count: 2,
        current_decade: 3,
      }),
    );

    expect(await screen.findByText('2 participants')).toBeInTheDocument();
    expect(screen.getByText(INITIATOR_EMAIL)).toBeInTheDocument();
    expect(screen.getByText('marie@jangubi.sn')).toBeInTheDocument();
    // La décade de `session_state` prime sur celle héritée de `join`.
    expect(screen.getByText('Décade 3')).toBeInTheDocument();
  });

  test('trusts the server verdict to reveal the initiator controls', async () => {
    // L'e-mail du compte ne correspond PAS à `initiator_email` : sans la trame,
    // la comparaison client masquerait les commandes.
    server.use(
      mockJoin(),
      http.get(`${env.API_URL}/v1/auth/me/`, () =>
        HttpResponse.json(createClergyUser('pretre', { email: 'autre@jangubi.sn' })),
      ),
    );

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    expect(
      screen.queryByRole('button', { name: /décade suivante/i }),
    ).not.toBeInTheDocument();

    act(() => ws.emitSessionState({ is_initiator: true }));

    expect(
      await screen.findByRole('button', { name: /décade suivante/i }),
    ).toBeInTheDocument();
  });

  test('shows a rejected action then lets the user dismiss it', async () => {
    server.use(mockJoin(), mockInitiatorUser());

    renderApp(<LiveRosarySession rosary={rosary} onLeave={vi.fn()} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    // Auparavant ce refus était SILENCIEUX : l'utilisateur ne distinguait pas
    // « refusé » de « perdu » et réessayait dans le vide.
    act(() =>
      ws.emitActionRejected(
        'advance',
        "Seul l'initiateur peut faire avancer le chapelet.",
      ),
    );

    // Le motif affiché est celui rédigé par le serveur (`ApplicationError`),
    // précédé du libellé lisible de l'action refusée.
    const rejection = await screen.findByText(
      /décade suivante — action refusée/i,
    );
    expect(rejection.parentElement).toHaveTextContent(
      "Seul l'initiateur peut faire avancer le chapelet.",
    );

    await userEvent.click(
      screen.getByRole('button', { name: /masquer l’avertissement/i }),
    );

    expect(
      screen.queryByText(/décade suivante — action refusée/i),
    ).not.toBeInTheDocument();
  });

  test('shows the closing screen when the session ends', async () => {
    server.use(mockJoin());
    const onLeave = vi.fn();

    renderApp(<LiveRosarySession rosary={rosary} onLeave={onLeave} />);
    await screen.findByText('Mystères Joyeux');
    const ws = await openSocket();

    act(() => ws.emitMessage({ type: 'rosary_ended' }));

    expect(await screen.findByText(/prière achevée/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /revenir à la liste/i }),
    );
    expect(onLeave).toHaveBeenCalled();
  });
});
