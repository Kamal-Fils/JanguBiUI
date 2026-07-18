import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { TvCategory, TvVideo } from '../../types';
import { TvContent } from '../tv-content';

const CATEGORIES_URL = `${env.API_URL}/v1/tv/categories/`;
const VIDEOS_URL = `${env.API_URL}/v1/tv/videos/`;

const createTvCategory = (overrides: Partial<TvCategory> = {}): TvCategory => ({
  id: 1,
  name: 'Messes',
  slug: 'messes',
  order: 0,
  is_clergy_only: false,
  ...overrides,
});

const createTvVideo = (overrides: Partial<TvVideo> = {}): TvVideo => ({
  id: 1,
  title: 'Messe du dimanche',
  youtube_url: 'https://youtu.be/abcdefghijk',
  category: { id: 1, name: 'Messes', slug: 'messes' },
  is_live: false,
  is_pinned_live: false,
  embed_url: 'https://www.youtube.com/embed/abcdefghijk',
  ...overrides,
});

function mockCategories(categories: TvCategory[]) {
  server.use(
    http.get(CATEGORIES_URL, () =>
      HttpResponse.json({ count: categories.length, results: categories }),
    ),
  );
}

/** Le handler respecte le filtre `category__slug` comme le back. */
function mockVideos(videos: TvVideo[]) {
  server.use(
    http.get(VIDEOS_URL, ({ request }) => {
      const slug = new URL(request.url).searchParams.get('category__slug');
      const results = slug
        ? videos.filter((v) => v.category.slug === slug)
        : videos;
      return HttpResponse.json({ count: results.length, results });
    }),
  );
}

describe('TvContent — vue publique', () => {
  test('affiche la grille groupée par catégorie avec pastille et section live', async () => {
    mockCategories([
      createTvCategory(),
      createTvCategory({ id: 2, name: 'Enseignements', slug: 'enseignements' }),
    ]);
    mockVideos([
      createTvVideo(),
      createTvVideo({
        id: 2,
        title: 'Lectio divina en direct',
        is_live: true,
        category: { id: 2, name: 'Enseignements', slug: 'enseignements' },
      }),
    ]);

    renderApp(<TvContent />);

    // Titres serif des cartes
    expect(await screen.findByText('Messe du dimanche')).toBeInTheDocument();
    expect(screen.getByText('Lectio divina en direct')).toBeInTheDocument();

    // Section « En direct maintenant » mise en avant
    expect(screen.getByText('En direct maintenant')).toBeInTheDocument();

    // La catégorie apparaît en pill de filtre ET en pastille de carte
    expect(screen.getAllByText('Messes').length).toBeGreaterThanOrEqual(2);
  });

  test('catégorie vide : empty state incitatif nommant la catégorie + retour à « Tous »', async () => {
    mockCategories([
      createTvCategory(),
      createTvCategory({ id: 2, name: 'Enseignements', slug: 'enseignements' }),
    ]);
    // Aucune vidéo dans « Enseignements »
    mockVideos([createTvVideo()]);

    renderApp(<TvContent />);

    await screen.findByText('Messe du dimanche');

    await userEvent.click(
      screen.getByRole('button', { name: 'Enseignements' }),
    );

    expect(
      await screen.findByText(/Rien dans « Enseignements »/),
    ).toBeInTheDocument();

    // L'action incitative ramène vers l'ensemble des programmes
    await userEvent.click(
      screen.getByRole('button', { name: 'Voir toutes les vidéos' }),
    );
    expect(await screen.findByText('Messe du dimanche')).toBeInTheDocument();
  });

  test('erreur de chargement : ErrorState avec retry qui recharge les vidéos', async () => {
    mockCategories([createTvCategory()]);
    mockVideos([createTvVideo()]);
    // Premier appel vidéos en échec — le retry retombe sur le handler OK.
    server.use(
      http.get(VIDEOS_URL, () => HttpResponse.json(null, { status: 500 }), {
        once: true,
      }),
    );

    renderApp(<TvContent />);

    expect(
      await screen.findByText('Impossible de charger les programmes'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ }));

    expect(await screen.findByText('Messe du dimanche')).toBeInTheDocument();
  });
});
