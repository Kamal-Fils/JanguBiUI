import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { Analytics } from '../../api/get-analytics';
import { AnalyticsDashboard } from '../analytics-dashboard';

// Les graphiques recharts mesurent le DOM (inutile + bruyant en jsdom) → on isole
// le dashboard (KPIs / filtres / état 403) du module de charts.
vi.mock('../analytics-charts', () => ({
  default: () => <div data-testid="charts" />,
}));

const ANALYTICS_URL = `${env.API_URL}/v1/dashboards/analytics/`;

const payload: Analytics = {
  level: 'diocese',
  entity: { id: 1, name: 'Diocèse de Thiès' },
  ranking_level: 'parish',
  period: {
    from: '2026-01-01T00:00:00Z',
    to: '2026-06-06T00:00:00Z',
    granularity: 'month',
  },
  kpis: {
    donations_total: 15000,
    donations_count: 3,
    donations_total_prev: 10000,
    delta_pct: 50,
    denier_rate: 40,
    fideles: 12,
    fideles_new: 2,
    active_units: 1,
    total_units: 4,
  },
  series: [{ bucket: '2026-05-01', total: 15000, count: 3 }],
  by_type: [
    {
      donation_type: 'sunday_collection',
      label: 'Quête',
      total: 15000,
      count: 3,
    },
  ],
  by_provider: [{ provider: 'cash', label: 'Espèces', total: 15000, count: 3 }],
  ranking: [{ id: 1, name: 'Paroisse A', total: 15000, count: 3 }],
};

const ACTIVITY_URL = `${env.API_URL}/v1/dashboards/analytics/activity/`;
const activityPayload = {
  level: 'diocese',
  grain: 'parish',
  rows: [
    {
      id: 1,
      name: 'Paroisse A',
      donations_total: 15000,
      fideles: 12,
      documents_pending: 2,
      intentions_pending: 1,
    },
  ],
  documents: { by_status: [], pending: 2, total: 5 },
  intentions: { by_status: [], pending: 1, total: 3 },
};

describe('AnalyticsDashboard', () => {
  test('affiche les KPIs scopés au périmètre', async () => {
    server.use(
      http.get(ANALYTICS_URL, () => HttpResponse.json(payload)),
      http.get(ACTIVITY_URL, () => HttpResponse.json(activityPayload)),
    );

    renderApp(<AnalyticsDashboard />);

    // Total des dons (formaté XOF, séparateur de milliers insécable).
    expect(await screen.findByText(/15.000.*FCFA/)).toBeInTheDocument();
    expect(screen.getByText('Diocèse · Diocèse de Thiès')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument(); // taux Denier
    expect(screen.getByText('1/4')).toBeInTheDocument(); // paroisses actives
    expect(screen.getByText('+50%')).toBeInTheDocument(); // delta période

    // Incrément 2 : matrice d'activité + files en souffrance.
    expect(
      await screen.findByText(/Matrice d.activité par paroisse/),
    ).toBeInTheDocument();
    expect(screen.getByText('Documents en attente')).toBeInTheDocument();
    expect(
      screen.getByText('Intentions de messe en attente'),
    ).toBeInTheDocument();
  });

  test('403 (clergé sans périmètre) → état vide explicite', async () => {
    server.use(
      http.get(ANALYTICS_URL, () =>
        HttpResponse.json({ detail: 'forbidden' }, { status: 403 }),
      ),
    );

    renderApp(<AnalyticsDashboard />);

    expect(
      await screen.findByText('Analytique indisponible'),
    ).toBeInTheDocument();
  });
});
