import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { TvCategory, TvVideo } from '../../types';
import { AdminVideosSection } from '../admin-videos-section';

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

function mockTvEndpoints({
  categories = [createTvCategory()],
  videos = [createTvVideo()],
}: { categories?: TvCategory[]; videos?: TvVideo[] } = {}) {
  server.use(
    http.get(CATEGORIES_URL, () =>
      HttpResponse.json({ count: categories.length, results: categories }),
    ),
    http.get(VIDEOS_URL, () =>
      HttpResponse.json({ count: videos.length, results: videos }),
    ),
  );
}

/**
 * Les actions par ligne vivent dans un menu « ⋯ » — on l'ouvre avant d'asserter.
 * La DataTable rend chaque ligne deux fois (table desktop + carte mobile,
 * départagées par CSS que jsdom n'applique pas) : on ouvre le premier menu.
 */
async function openRowActions(videoTitle: string) {
  const [trigger] = await screen.findAllByRole('button', {
    name: `Actions pour ${videoTitle}`,
  });
  await userEvent.click(trigger);
}

describe('AdminVideosSection — menu « ⋯ » et suppression', () => {
  test('le menu « ⋯ » expose Éditer et Supprimer ; Éditer ouvre le formulaire', async () => {
    mockTvEndpoints();

    renderApp(<AdminVideosSection />);

    await openRowActions('Messe du dimanche');

    expect(
      await screen.findByRole('menuitem', { name: 'Éditer' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Supprimer' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Éditer' }));

    // Le formulaire d'édition s'ouvre, pré-rempli sur la vidéo choisie.
    expect(await screen.findByText('Modifier la vidéo')).toBeInTheDocument();
    expect(screen.getByLabelText(/URL YouTube/)).toHaveValue(
      'https://youtu.be/abcdefghijk',
    );
  });

  test('Supprimer ouvre la confirmation puis retire la vidéo (mutation conservée)', async () => {
    // Handler stateful : après le DELETE, le refetch (invalidation) renvoie
    // une liste vide — comme le ferait le back.
    let deleted = false;
    server.use(
      http.get(CATEGORIES_URL, () =>
        HttpResponse.json({ count: 1, results: [createTvCategory()] }),
      ),
      http.get(VIDEOS_URL, () => {
        const results = deleted ? [] : [createTvVideo()];
        return HttpResponse.json({ count: results.length, results });
      }),
      http.delete(`${VIDEOS_URL}:videoId/`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderApp(<AdminVideosSection />);

    await openRowActions('Messe du dimanche');
    await userEvent.click(screen.getByRole('menuitem', { name: 'Supprimer' }));

    // Dialog de confirmation
    expect(
      await screen.findByText(/Supprimer cette vidéo/),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    await waitFor(() => {
      expect(screen.queryByText('Messe du dimanche')).not.toBeInTheDocument();
    });
  });

  test("liste vide : empty state incitatif dont l'action ouvre le formulaire de création", async () => {
    mockTvEndpoints({ videos: [] });

    renderApp(<AdminVideosSection />);

    expect(
      await screen.findByText('Ajoutez votre première vidéo'),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Ajouter une vidéo' }),
    );

    expect(await screen.findByText('Nouvelle vidéo')).toBeInTheDocument();
  });
});
