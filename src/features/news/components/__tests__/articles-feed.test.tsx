import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createArticle } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ArticlesFeed } from '../articles-feed';

const FEED = `${env.API_URL}/v1/news/feed/`;

describe('ArticlesFeed', () => {
  test('shows loading skeleton while fetching the aggregated feed', async () => {
    server.use(
      http.get(FEED, async () => {
        await delay(Infinity);
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );

    renderApp(<ArticlesFeed />);

    // eslint-disable-next-line testing-library/no-node-access
    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  test('renders a single aggregated feed (no Universel/Ma paroisse tabs)', async () => {
    // Le back agrège déjà global ∪ paroisse ∪ diocèse : un seul flux, pas d'onglet.
    const mockArticles = [
      createArticle({
        id: 'a1',
        title: 'Le pape François appelle à la paix',
        scope_type: 'global',
      }),
      createArticle({
        id: 'p1',
        title: 'Réunion du conseil paroissial',
        scope_type: 'parish',
      }),
    ];
    server.use(
      http.get(FEED, () =>
        HttpResponse.json({ count: mockArticles.length, results: mockArticles }),
      ),
    );

    renderApp(<ArticlesFeed />);

    // Articles de portées différentes affichés dans le MÊME flux.
    await screen.findByText('Le pape François appelle à la paix');
    expect(
      screen.getByText('Réunion du conseil paroissial'),
    ).toBeInTheDocument();
    // Plus aucun onglet.
    expect(
      screen.queryByRole('button', { name: /ma paroisse/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /universel/i }),
    ).not.toBeInTheDocument();
  });

  test('shows empty state when the feed is empty', async () => {
    server.use(
      http.get(FEED, () => HttpResponse.json({ count: 0, results: [] })),
    );

    renderApp(<ArticlesFeed />);

    expect(
      await screen.findByText(/aucune actualité disponible/i),
    ).toBeInTheDocument();
  });

  test('shows error message when the feed request fails', async () => {
    server.use(http.get(FEED, () => HttpResponse.error()));

    renderApp(<ArticlesFeed />);

    expect(
      await screen.findByText(/impossible de charger les actualités/i),
    ).toBeInTheDocument();
  });
});
