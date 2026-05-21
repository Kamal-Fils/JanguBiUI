import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createArticle } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ArticlesFeed } from '../articles-feed';

describe('ArticlesFeed', () => {
  test('shows loading skeleton while fetching articles', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/`, async () => {
        await delay(Infinity);
        return HttpResponse.json({ count: 0, results: [] });
      }),
      http.get(`${env.API_URL}/v1/news/my-parish/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(<ArticlesFeed />);

    // eslint-disable-next-line testing-library/no-node-access
    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  test('shows global articles on the default "Universel" tab', async () => {
    const mockArticles = [
      createArticle({
        id: 'a1',
        title: 'Le pape François appelle à la paix',
        scope_type: 'global',
      }),
      createArticle({
        id: 'a2',
        title: 'Retraite au sanctuaire de Popenguine',
        scope_type: 'global',
      }),
    ];
    server.use(
      http.get(`${env.API_URL}/v1/news/`, () =>
        HttpResponse.json({
          count: mockArticles.length,
          results: mockArticles,
        }),
      ),
      http.get(`${env.API_URL}/v1/news/my-parish/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(<ArticlesFeed />);

    await screen.findByText('Le pape François appelle à la paix');
    expect(
      screen.getByText('Retraite au sanctuaire de Popenguine'),
    ).toBeInTheDocument();
  });

  test('shows empty state when no articles are available', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${env.API_URL}/v1/news/my-parish/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(<ArticlesFeed />);

    expect(
      await screen.findByText(/aucune actualité disponible/i),
    ).toBeInTheDocument();
  });

  test('shows error message when global articles request fails', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/`, () => HttpResponse.error()),
      http.get(`${env.API_URL}/v1/news/my-parish/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(<ArticlesFeed />);

    expect(
      await screen.findByText(/impossible de charger les actualités/i),
    ).toBeInTheDocument();
  });

  test('switches to parish tab and shows parish articles', async () => {
    const parishArticle = createArticle({
      id: 'p1',
      title: 'Réunion du conseil paroissial',
      scope_type: 'parish',
    });
    server.use(
      http.get(`${env.API_URL}/v1/news/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${env.API_URL}/v1/news/my-parish/`, () =>
        HttpResponse.json({ count: 1, results: [parishArticle] }),
      ),
    );

    renderApp(<ArticlesFeed />);

    await userEvent.click(screen.getByRole('button', { name: /ma paroisse/i }));

    expect(
      await screen.findByText('Réunion du conseil paroissial'),
    ).toBeInTheDocument();
  });

  test('shows empty state for parish tab when no parish articles', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/news/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
      http.get(`${env.API_URL}/v1/news/my-parish/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(<ArticlesFeed />);

    await userEvent.click(screen.getByRole('button', { name: /ma paroisse/i }));

    expect(
      await screen.findByText(/aucune actualité pour votre paroisse/i),
    ).toBeInTheDocument();
  });
});
