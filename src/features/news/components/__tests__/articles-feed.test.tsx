import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { useSearchParams } from 'next/navigation';

import { env } from '@/config/env';
import { createArticle, createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ArticlesFeed } from '../articles-feed';

const FEED = `${env.API_URL}/v1/news/feed/`;

// Le filtre par type est un état d'URL (?type=…) piloté par la sidebar (V4-1B1).
// useSearchParams est mocké en vi.fn() dans setup-tests.ts (défaut : get → null),
// simuler une route /app/actus?type=… = surcharger le mock par test.
const mockUseSearchParams = vi.mocked(useSearchParams);

function withTypeParam(type: string) {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => (key === 'type' ? type : null),
  } as never);
}

const MEMBERSHIPS = [
  {
    id: 1,
    church: { id: 111, name: 'Église A' },
    parish: { id: 11, name: 'Saint-Pierre' },
    diocese: { id: 1, name: 'Diocèse de Dakar' },
    is_primary: true,
  },
  {
    id: 2,
    church: { id: 211, name: 'Église B' },
    parish: { id: 21, name: 'Sainte-Anne' },
    diocese: { id: 2, name: 'Diocèse de Thiès' },
    is_primary: false,
  },
];

describe('ArticlesFeed', () => {
  beforeEach(() => {
    // Défaut : pas de param ?type= → fil complet (mockReturnValue survit à
    // clearAllMocks, on le réinitialise donc explicitement à chaque test).
    mockUseSearchParams.mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    } as never);
  });

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

  test('renders church-scoped articles without erroring (scope_type "church")', async () => {
    // Anti-régression : le back émet des articles de portée "church" (Chantier 3a).
    // L'enum Zod front doit l'accepter, sinon articleSchema.parse throw → page d'erreur.
    const mockArticles = [
      createArticle({
        id: 'c1',
        title: 'Veillée de prière — Cathédrale du Souvenir',
        scope_type: 'church',
        scope_church_id: 5,
      }),
    ];
    server.use(
      http.get(FEED, () =>
        HttpResponse.json({ count: mockArticles.length, results: mockArticles }),
      ),
    );

    renderApp(<ArticlesFeed />);

    await screen.findByText('Veillée de prière — Cathédrale du Souvenir');
    expect(
      screen.queryByText(/impossible de charger les actualités/i),
    ).not.toBeInTheDocument();
  });

  test('shows empty state when the feed is empty', async () => {
    server.use(
      http.get(FEED, () => HttpResponse.json({ count: 0, results: [] })),
    );

    renderApp(<ArticlesFeed />);

    expect(
      await screen.findByText(/^aucune actualité$/i),
    ).toBeInTheDocument();
  });

  test('shows error message when the feed request fails', async () => {
    server.use(http.get(FEED, () => HttpResponse.error()));

    renderApp(<ArticlesFeed />);

    expect(
      await screen.findByText(/impossible de charger les actualités/i),
    ).toBeInTheDocument();
  });

  test('filtre « Église A » → envoie scope_type=church&scope_id et restreint le fil', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/auth/me/`, () =>
        HttpResponse.json(createUser({ memberships: MEMBERSHIPS })),
      ),
      http.get(FEED, ({ request }) => {
        const params = new URL(request.url).searchParams;
        if (
          params.get('scope_type') === 'church' &&
          params.get('scope_id') === '111'
        ) {
          return HttpResponse.json({
            count: 1,
            results: [
              createArticle({
                id: 'churchA',
                title: 'Veillée Église A',
                scope_type: 'church',
                scope_church_id: 111,
              }),
            ],
          });
        }
        // Sans filtre (« Tous ») → agrégat.
        return HttpResponse.json({
          count: 2,
          results: [
            createArticle({ id: 'g1', title: 'Article Universel', scope_type: 'global' }),
            createArticle({
              id: 'churchA',
              title: 'Veillée Église A',
              scope_type: 'church',
              scope_church_id: 111,
            }),
          ],
        });
      }),
    );

    renderApp(<ArticlesFeed />);

    // Agrégat au départ (« Tous »).
    await screen.findByText('Article Universel');
    expect(screen.getByText('Veillée Église A')).toBeInTheDocument();

    // Sélection du filtre « Église A ».
    await userEvent.click(await screen.findByRole('button', { name: 'Église A' }));

    // Le fil est restreint à la portée église A (l'article universel disparaît).
    await screen.findByText('Veillée Église A');
    await waitFor(() =>
      expect(screen.queryByText('Article Universel')).not.toBeInTheDocument(),
    );
  });

  test('sans param ?type= → fil complet (pas de content_type) et plus de tablist', async () => {
    const seenUrls: string[] = [];
    server.use(
      http.get(FEED, ({ request }) => {
        seenUrls.push(request.url);
        return HttpResponse.json({
          count: 2,
          results: [
            createArticle({
              id: 'a1',
              title: 'Un article de fond',
              content_type: 'article',
            }),
            createArticle({
              id: 'n1',
              title: 'Une annonce paroissiale',
              content_type: 'announcement',
            }),
          ],
        });
      }),
    );

    renderApp(<ArticlesFeed />);

    // Tous les types cohabitent dans le fil.
    await screen.findByText('Un article de fond');
    expect(screen.getByText('Une annonce paroissiale')).toBeInTheDocument();
    // La requête serveur ne porte AUCUN filtre de type.
    expect(seenUrls.length).toBeGreaterThan(0);
    expect(new URL(seenUrls[0]).searchParams.get('content_type')).toBeNull();
    // Plus d'onglets internes : la navigation par type se fait via la sidebar.
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    // Titre générique sans filtre.
    expect(
      screen.getByRole('heading', { name: 'Actualité' }),
    ).toBeInTheDocument();
  });

  test('route /app/actus?type=article → la requête API porte content_type=article', async () => {
    withTypeParam('article');
    const seenUrls: string[] = [];
    server.use(
      http.get(FEED, ({ request }) => {
        seenUrls.push(request.url);
        return HttpResponse.json({
          count: 1,
          results: [
            createArticle({
              id: 'a1',
              title: 'Un article filtré',
              content_type: 'article',
            }),
          ],
        });
      }),
    );

    renderApp(<ArticlesFeed />);

    await screen.findByText('Un article filtré');
    expect(seenUrls.length).toBeGreaterThan(0);
    expect(new URL(seenUrls[0]).searchParams.get('content_type')).toBe(
      'article',
    );
    // Le titre reflète le filtre actif.
    expect(
      screen.getByRole('heading', { name: 'Actualité — Articles' }),
    ).toBeInTheDocument();
  });

  test('route ?type=announcement → filtre serveur + bloc « Annonces du dimanche »', async () => {
    withTypeParam('announcement');
    // Même calcul que le composant : dimanche à venir (aujourd'hui si dimanche).
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
    const sundayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const seenUrls: string[] = [];
    server.use(
      http.get(FEED, ({ request }) => {
        seenUrls.push(request.url);
        return HttpResponse.json({
          count: 1,
          results: [
            createArticle({
              id: 'n1',
              title: 'Messe des familles',
              content_type: 'announcement',
              announcement_date: sundayIso,
            }),
          ],
        });
      }),
    );

    renderApp(<ArticlesFeed />);

    // Le bloc dominical est toujours déclenché par le filtre — désormais lu depuis l'URL.
    await screen.findByText('Messe des familles');
    expect(screen.getByText('Annonces du dimanche')).toBeInTheDocument();
    expect(new URL(seenUrls[0]).searchParams.get('content_type')).toBe(
      'announcement',
    );
  });

  test('param ?type= inconnu → fallback « tout » (aucun content_type envoyé)', async () => {
    withTypeParam('inconnu');
    const seenUrls: string[] = [];
    server.use(
      http.get(FEED, ({ request }) => {
        seenUrls.push(request.url);
        return HttpResponse.json({
          count: 1,
          results: [
            createArticle({
              id: 'a1',
              title: 'Fil complet malgré le param invalide',
              content_type: 'article',
            }),
          ],
        });
      }),
    );

    renderApp(<ArticlesFeed />);

    await screen.findByText('Fil complet malgré le param invalide');
    expect(new URL(seenUrls[0]).searchParams.get('content_type')).toBeNull();
    // Titre générique : le param invalide n'est pas reflété.
    expect(
      screen.getByRole('heading', { name: 'Actualité' }),
    ).toBeInTheDocument();
  });
});
