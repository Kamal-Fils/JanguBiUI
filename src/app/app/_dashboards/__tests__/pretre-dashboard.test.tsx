import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { PretreeDashboard } from '../pretre-dashboard';

const INTENTIONS_URL = `${env.API_URL}/v1/mass-intentions/parish/`;
const INBOX_URL = `${env.API_URL}/v1/messaging/clerical/inbox/`;
const PARISH_URL = `${env.API_URL}/v1/dashboards/my-parish/`;
const REFLECTION_URL = `${env.API_URL}/v1/spiritual/reflections/my-today/`;

const boom = () => new HttpResponse(null, { status: 500 });

function intention(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    intention_type: 'for_deceased',
    intention_text: 'Pour le repos de Marie Diop',
    status: 'pending',
    requestor_email: 'fidele@test.sn',
    notes: '',
    created_at: '2026-07-01T08:00:00Z',
    updated_at: '2026-07-01T08:00:00Z',
    ...overrides,
  };
}

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    sender_email: 'eveque@test.sn',
    recipient_scope: 'individual',
    subject: 'Visite pastorale',
    body: 'Bonjour',
    read_at: null,
    created_at: '2026-07-01T08:00:00Z',
    ...overrides,
  };
}

const PARISH_DASHBOARD = {
  parish: {
    id: 11,
    name: 'Saint-Pierre',
    city: 'Dakar',
    diocese: 'Dakar',
  },
  total_fideles: 1240,
  followers: 300,
  donation_flow_year: { total: '500000', count: 12, by_type: [] },
  donation_flow_month: { total: '40000', count: 2, by_type: [] },
  pending_documents: 4,
  pending_intentions: 1,
  churches: [],
  clergy: [],
};

/** Toutes les routes de l'écran répondent — les tests surchargent au besoin. */
function mockBackend() {
  server.use(
    http.get(INTENTIONS_URL, () =>
      HttpResponse.json({ count: 1, results: [intention()] }),
    ),
    http.get(INBOX_URL, () =>
      HttpResponse.json({ count: 1, results: [message()] }),
    ),
    http.get(PARISH_URL, () => HttpResponse.json(PARISH_DASHBOARD)),
    http.get(REFLECTION_URL, () => new HttpResponse(null, { status: 404 })),
  );
}

describe('PretreeDashboard', () => {
  beforeEach(mockBackend);

  test('ouvre sur la charge de travail du jour, pas sur une salutation', async () => {
    renderApp(<PretreeDashboard />);

    // Le sujet de l'écran : ce qui attend un acte (DIRECTION R2).
    expect(
      await screen.findByRole('heading', { name: /à traiter aujourd/i }),
    ).toBeInTheDocument();

    // 1 intention en attente + 1 message non lu + 4 documents = 6.
    expect(await screen.findByText('6')).toBeInTheDocument();

    // La paroisse situe le périmètre, sans bannière de bienvenue.
    expect(
      await screen.findByRole('heading', { name: /ma paroisse aujourd/i }),
    ).toBeInTheDocument();
  });

  test('les files sont accessibles en un tap depuis la tête de page', async () => {
    renderApp(<PretreeDashboard />);

    expect(
      await screen.findByRole('link', { name: /1 intention à accepter/i }),
    ).toHaveAttribute('href', '/app/clerge/intentions');
    expect(
      screen.getByRole('link', { name: /4 demandes de document/i }),
    ).toHaveAttribute('href', '/app/admin/documents');
  });

  test('affiche l’intention en attente avec son acte à poser', async () => {
    renderApp(<PretreeDashboard />);

    expect(
      await screen.findByText(/pour le repos de marie diop/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /accepter/i }),
    ).toBeInTheDocument();
  });

  test('une panne sur les intentions est récupérable, pas silencieuse', async () => {
    server.use(http.get(INTENTIONS_URL, boom));
    renderApp(<PretreeDashboard />);

    expect(
      await screen.findByText(/intentions indisponibles/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /réessayer/i }).length,
    ).toBeGreaterThan(0);
    // L'état vide ne doit pas se faire passer pour « rien à faire ».
    expect(
      screen.queryByText(/aucune intention en attente/i),
    ).not.toBeInTheDocument();
  });

  test('une panne sur la messagerie est récupérable, pas silencieuse', async () => {
    server.use(http.get(INBOX_URL, boom));
    renderApp(<PretreeDashboard />);

    expect(
      await screen.findByText(/boîte de réception indisponible/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/aucun message/i)).not.toBeInTheDocument();
  });

  test('une paroisse non rattachée (404) s’explique au lieu de disparaître', async () => {
    server.use(
      http.get(PARISH_URL, () => new HttpResponse(null, { status: 404 })),
    );
    renderApp(<PretreeDashboard />);

    expect(
      await screen.findByText(/aucune paroisse rattachée/i),
    ).toBeInTheDocument();
  });

  test('une panne des statistiques paroissiales reste récupérable', async () => {
    server.use(http.get(PARISH_URL, boom));
    renderApp(<PretreeDashboard />);

    expect(
      await screen.findByText(/statistiques paroissiales indisponibles/i),
    ).toBeInTheDocument();
  });
});
