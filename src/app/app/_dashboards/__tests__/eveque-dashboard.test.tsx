import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { EvequeeDashboard } from '../eveque-dashboard';

const INBOX_URL = `${env.API_URL}/v1/messaging/clerical/inbox/`;
const ARTICLES_URL = `${env.API_URL}/v1/news/admin/`;
const DIOCESE_URL = `${env.API_URL}/v1/dashboards/my-diocese/`;

const boom = () => new HttpResponse(null, { status: 500 });

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    sender_email: 'cure@test.sn',
    recipient_scope: 'individual',
    subject: 'Rapport de paroisse',
    body: 'Bonjour',
    read_at: null,
    created_at: '2026-07-01T08:00:00Z',
    ...overrides,
  };
}

function article(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    title: 'Lettre de rentrée pastorale',
    slug: 'lettre-rentree',
    author_name: 'Mgr Ndiaye',
    scope_type: 'diocese',
    status: 'draft',
    views_count: 0,
    created_at: '2026-07-01T08:00:00Z',
    ...overrides,
  };
}

const DIOCESE_DASHBOARD = {
  diocese: { id: 1, name: 'Diocèse de Thiès', province: 'Dakar' },
  parishes_count: 24,
  total_fideles: 45000,
  donations_total: '3200000',
  parishes_without_main_church: 2,
  pending_documents: 7,
};

function mockBackend() {
  server.use(
    http.get(INBOX_URL, () =>
      HttpResponse.json({ count: 1, results: [message()] }),
    ),
    http.get(ARTICLES_URL, () =>
      HttpResponse.json({ count: 1, results: [article()] }),
    ),
    http.get(DIOCESE_URL, () => HttpResponse.json(DIOCESE_DASHBOARD)),
  );
}

describe('EvequeeDashboard', () => {
  beforeEach(mockBackend);

  test('ouvre sur ce qui attend un arbitrage, avec le diocèse en contexte', async () => {
    renderApp(<EvequeeDashboard />);

    expect(
      await screen.findByRole('heading', { name: /à traiter aujourd/i }),
    ).toBeInTheDocument();

    // 1 message non lu + 1 brouillon + 7 documents = 9.
    expect(await screen.findByText('9')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: /mon diocèse aujourd/i }),
    ).toBeInTheDocument();
  });

  test('le brouillon mène directement à son édition', async () => {
    renderApp(<EvequeeDashboard />);

    expect(
      await screen.findByRole('link', { name: /lettre de rentrée pastorale/i }),
    ).toHaveAttribute('href', '/app/admin/articles/a1/edit');
  });

  test('l’action d’écriture reste visible', async () => {
    renderApp(<EvequeeDashboard />);

    expect(
      await screen.findByRole('link', { name: /nouvelle publication/i }),
    ).toHaveAttribute('href', '/app/admin/articles/new');
  });

  test('une panne sur la messagerie est récupérable, pas silencieuse', async () => {
    server.use(http.get(INBOX_URL, boom));
    renderApp(<EvequeeDashboard />);

    expect(
      await screen.findByText(/boîte de réception indisponible/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/aucun message/i)).not.toBeInTheDocument();
  });

  test('une panne sur les brouillons est récupérable, pas silencieuse', async () => {
    server.use(http.get(ARTICLES_URL, boom));
    renderApp(<EvequeeDashboard />);

    expect(
      await screen.findByText(/brouillons indisponibles/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/aucun brouillon en attente/i),
    ).not.toBeInTheDocument();
  });

  test('une panne des chiffres diocésains reste récupérable', async () => {
    server.use(http.get(DIOCESE_URL, boom));
    renderApp(<EvequeeDashboard />);

    expect(
      await screen.findByText(/consolidation diocésaine indisponible/i),
    ).toBeInTheDocument();
  });

  test('un diocèse non rattaché (404) s’explique au lieu de disparaître', async () => {
    server.use(
      http.get(DIOCESE_URL, () => new HttpResponse(null, { status: 404 })),
    );
    renderApp(<EvequeeDashboard />);

    expect(
      await screen.findByText(/aucun diocèse rattaché/i),
    ).toBeInTheDocument();
  });
});
