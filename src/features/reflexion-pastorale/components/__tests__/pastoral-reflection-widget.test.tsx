import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, userEvent } from '@/testing/test-utils';

import { PastoralReflectionWidget } from '../pastoral-reflection-widget';

const TODAY_URL = `${env.API_URL}/v1/spiritual/reflections/today/`;

const reflection = {
  id: '0b6f5a1e-8f5f-4a7e-9f43-2f4a6f9b1c11',
  content: 'Le Seigneur est mon berger.',
  author_name: 'Abbé Ndiaye',
  reflection_date: '2026-07-18',
  created_at: '2026-07-18T06:00:00Z',
  updated_at: '2026-07-18T06:00:00Z',
};

describe('PastoralReflectionWidget', () => {
  test('shows the reflection with its author after loading', async () => {
    server.use(http.get(TODAY_URL, () => HttpResponse.json(reflection)));

    renderApp(<PastoralReflectionWidget />);

    expect(
      await screen.findByText(/le seigneur est mon berger/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Abbé Ndiaye')).toBeInTheDocument();
    expect(screen.getByText(/réflexion du jour/i)).toBeInTheDocument();
  });

  test('renders nothing when no reflection is published today (200 + null)', async () => {
    server.use(http.get(TODAY_URL, () => HttpResponse.json(null)));

    renderApp(<PastoralReflectionWidget />);

    // On attend la fin du chargement (disparition du squelette)…
    await waitFor(() => {
      expect(document.querySelector('.animate-pulse')).toBeNull();
    });
    // …puis le widget s'efface complètement.
    expect(screen.queryByText(/réflexion du jour/i)).not.toBeInTheDocument();
  });

  test('shows an error state with retry when loading fails', async () => {
    let calls = 0;
    server.use(
      http.get(TODAY_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ detail: 'Erreur' }, { status: 500 });
        }
        return HttpResponse.json(reflection);
      }),
    );

    renderApp(<PastoralReflectionWidget />);

    expect(
      await screen.findByText(/impossible de charger la réflexion du jour/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(
      await screen.findByText(/le seigneur est mon berger/i),
    ).toBeInTheDocument();
  });
});
