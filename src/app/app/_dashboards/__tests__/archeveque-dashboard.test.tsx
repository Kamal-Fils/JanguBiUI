import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ArchevequeDashboard } from '../archeveque-dashboard';

const PROVINCE_URL = `${env.API_URL}/v1/dashboards/my-province/`;

const boom = () => new HttpResponse(null, { status: 500 });

const PROVINCE_DASHBOARD = {
  province: { id: 1, name: 'Dakar' },
  dioceses_count: 2,
  parishes_count: 60,
  total_fideles: 120000,
  donations_total_year: '9500000',
  pending_documents: 5,
  dioceses: [
    {
      id: 1,
      name: 'Diocèse de Dakar',
      parishes_count: 36,
      fideles_count: 80000,
      pending_documents: 3,
    },
    {
      id: 2,
      name: 'Diocèse de Thiès',
      parishes_count: 24,
      fideles_count: 40000,
      pending_documents: 0,
    },
  ],
};

describe('ArchevequeDashboard', () => {
  beforeEach(() => {
    server.use(http.get(PROVINCE_URL, () => HttpResponse.json(PROVINCE_DASHBOARD)));
  });

  test('ouvre sur la province, pas sur un seul diocèse', async () => {
    renderApp(<ArchevequeDashboard />);

    expect(
      await screen.findByRole('heading', { name: /ma province aujourd/i }),
    ).toBeInTheDocument();
    // Le périmètre nommé : c'est la correction d'audit (vue PROVINCE).
    expect(await screen.findByText(/conduite de la province · dakar/i)).toBeInTheDocument();
  });

  test('chaque diocèse est comparable ligne à ligne', async () => {
    renderApp(<ArchevequeDashboard />);

    expect(await screen.findByText('Diocèse de Dakar')).toBeInTheDocument();
    expect(screen.getByText('Diocèse de Thiès')).toBeInTheDocument();

    // Le retard est nommé, pas seulement coloré (WCAG 1.4.1).
    expect(screen.getByText(/3 documents en attente/i)).toBeInTheDocument();
    expect(screen.getByText(/à jour/i)).toBeInTheDocument();
  });

  test('les chiffres de la province sont affichés', async () => {
    renderApp(<ArchevequeDashboard />);

    expect(await screen.findByText('Diocèses')).toBeInTheDocument();
    expect(screen.getByText('120 000')).toBeInTheDocument();
  });

  test('une panne affiche une erreur récupérable, pas une page muette', async () => {
    server.use(http.get(PROVINCE_URL, boom));
    renderApp(<ArchevequeDashboard />);

    expect(
      await screen.findByText(/vue provinciale indisponible/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
    // L'en-tête reste : l'utilisateur sait où il est malgré la panne.
    expect(
      screen.getByRole('heading', { name: /ma province aujourd/i }),
    ).toBeInTheDocument();
  });

  test('une province sans diocèse affiche un état vide explicite', async () => {
    server.use(
      http.get(PROVINCE_URL, () =>
        HttpResponse.json({ ...PROVINCE_DASHBOARD, dioceses: [] }),
      ),
    );
    renderApp(<ArchevequeDashboard />);

    expect(
      await screen.findByText(/aucun diocèse rattaché à cette province/i),
    ).toBeInTheDocument();
  });
});
