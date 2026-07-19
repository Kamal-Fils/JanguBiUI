import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { FideleSummarySection } from '../fidele-summary-section';
import { GlobalStatsSection } from '../global-stats-section';

const ME_URL = `${env.API_URL}/v1/dashboards/me/`;
const GLOBAL_URL = `${env.API_URL}/v1/dashboards/global/`;

const boom = () => new HttpResponse(null, { status: 500 });

const FIDELE_DASHBOARD = {
  parish: { id: 11, name: 'Saint-Pierre', city: 'Dakar' },
  principal_cure_email: 'cure@test.sn',
  documents: { total: 5, in_progress: 2, deposited: 3 },
  mass_intentions: 1,
  donations: { total: '15000', count: 3 },
};

const GLOBAL_DASHBOARD = {
  users_total: 9000,
  users_new_30d: 120,
  fideles_count: 8600,
  clergy_count: 400,
  pending_clergy_invitations: 6,
  provinces_count: 1,
  dioceses_count: 7,
  parishes_count: 300,
  articles_published: 45,
  pending_documents: 12,
  donations_total_year: '4500000',
};

/**
 * Ces deux blocs renvoyaient `null` en cas d'erreur : l'utilisateur voyait une
 * zone blanche, sans savoir si l'application n'avait rien à dire ou si elle
 * était en panne — et sans moyen de réessayer.
 */
describe('FideleSummarySection', () => {
  test('affiche les demandes en cours et le total des dons', async () => {
    server.use(http.get(ME_URL, () => HttpResponse.json(FIDELE_DASHBOARD)));
    renderApp(<FideleSummarySection />);

    expect(await screen.findByText('Demandes en cours')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('15 000 FCFA')).toBeInTheDocument();
  });

  test('une panne affiche une erreur récupérable, pas une zone blanche', async () => {
    server.use(http.get(ME_URL, boom));
    renderApp(<FideleSummarySection />);

    expect(
      await screen.findByText(/votre résumé est indisponible/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
  });
});

describe('GlobalStatsSection', () => {
  test('affiche les compteurs et les files actionnables', async () => {
    server.use(http.get(GLOBAL_URL, () => HttpResponse.json(GLOBAL_DASHBOARD)));
    renderApp(<GlobalStatsSection />);

    expect(await screen.findByText('Utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('9 000')).toBeInTheDocument();

    // Une file d'attente mène à l'écran qui la traite (DIRECTION R1).
    expect(
      screen.getByRole('link', { name: /invitations clergé/i }),
    ).toHaveAttribute('href', '/app/admin/users/invitations');
    expect(screen.getByRole('link', { name: /documents/i })).toHaveAttribute(
      'href',
      '/app/admin/documents',
    );
  });

  test('une panne affiche une erreur récupérable, pas une zone blanche', async () => {
    server.use(http.get(GLOBAL_URL, boom));
    renderApp(<GlobalStatsSection />);

    expect(
      await screen.findByText(/vue d’ensemble indisponible/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
  });
});
