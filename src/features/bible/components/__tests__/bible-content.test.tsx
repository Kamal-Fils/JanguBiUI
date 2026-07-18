import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { useSearchParams } from 'next/navigation';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { BibleContent } from '../bible-content';

// Les vues de la page Bible sont pilotées par l'URL (`?tab=`) depuis la
// sous-nav Spiritualité de la sidebar (retours testeurs n°2 : plus de barre
// d'onglets interne). useSearchParams est mocké en vi.fn() dans setup-tests.ts
// (défaut : get → null) ; simuler /app/bible?tab=… = surcharger le mock.
const mockUseSearchParams = vi.mocked(useSearchParams);

function withTabParam(tab: string | null) {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => (key === 'tab' ? tab : null),
  } as never);
}

describe('BibleContent (vues pilotées par ?tab=)', () => {
  beforeEach(() => {
    // Défaut : pas de param ?tab= (mockReturnValue survit à clearAllMocks,
    // on le réinitialise donc explicitement à chaque test).
    withTabParam(null);
  });

  test('sans param ?tab= : la vue lecture (livres de la Bible) est affichée', async () => {
    renderApp(<BibleContent />);

    // La vue lecture expose la recherche + le sélecteur de testament.
    expect(
      await screen.findByPlaceholderText(/rechercher un terme exact/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ancien Testament' }),
    ).toBeInTheDocument();
    // Les livres arrivent du handler MSW par défaut.
    expect(await screen.findByText('Genèse')).toBeInTheDocument();
  });

  test("plus de barre d'onglets interne (la sidebar pilote les vues)", () => {
    renderApp(<BibleContent />);

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    // Les anciennes entrées Aujourd'hui / Messe / Heures ont disparu.
    expect(screen.queryByText("Aujourd'hui")).not.toBeInTheDocument();
    expect(screen.queryByText('Messe')).not.toBeInTheDocument();
    expect(screen.queryByText('Heures')).not.toBeInTheDocument();
  });

  test('?tab=lectio : la vue Lectio Divina est affichée', () => {
    withTabParam('lectio');

    renderApp(<BibleContent />);

    expect(screen.getByText('Lectio Divina')).toBeInTheDocument();
    // Première étape du parcours en 4 temps.
    expect(
      screen.getByPlaceholderText(/vos notes pour l'étape lectio/i),
    ).toBeInTheDocument();
    // La vue lecture n'est pas rendue.
    expect(
      screen.queryByPlaceholderText(/rechercher un terme exact/i),
    ).not.toBeInTheDocument();
  });

  test('?tab=parcours : la liste des parcours de lecture est affichée', async () => {
    withTabParam('parcours');
    server.use(
      http.get(`${env.API_URL}/v1/bible/reading-plans/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            {
              id: 1,
              title: 'Évangile de Marc en 30 jours',
              description: 'Un chapitre par jour.',
              is_published: true,
              author_email: 'pretre@jangubi.sn',
              created_at: '2026-07-01T08:00:00Z',
            },
          ],
        }),
      ),
    );

    renderApp(<BibleContent />);

    expect(
      await screen.findByText('Évangile de Marc en 30 jours'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: "S'inscrire" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/rechercher un terme exact/i),
    ).not.toBeInTheDocument();
  });

  test('?tab= inconnu (ex. ancien onglet retiré) : retombe sur la vue lecture', async () => {
    // « aujourdhui » était un onglet interne avant la refonte V4-1B2.
    withTabParam('aujourdhui');

    renderApp(<BibleContent />);

    expect(
      await screen.findByPlaceholderText(/rechercher un terme exact/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Lectio Divina')).not.toBeInTheDocument();
  });
});
