import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createArticleDetail } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, waitFor } from '@/testing/test-utils';

import type { ArticleReactions } from '../../types';
import { ArticleDetail } from '../article-detail';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const ARTICLE_ID = 'article-1';
const DETAIL_URL = `${env.API_URL}/v1/news/${ARTICLE_ID}/`;
const REACTIONS_URL = `${env.API_URL}/v1/news/${ARTICLE_ID}/reactions/`;

const NO_REACTIONS: ArticleReactions = {
  counts: { pray: 0, amen: 0, attend: 0 },
  mine: [],
};

/**
 * Les tests passent par l'écran réel plutôt que par la barre isolée : la mise à
 * jour optimiste transite par le cache react-query, donc la brancher sur une
 * prop littérale testerait un chemin qui n'existe pas en production.
 */
function renderArticle(reactions: ArticleReactions | undefined = NO_REACTIONS) {
  server.use(
    http.get(DETAIL_URL, () =>
      HttpResponse.json(
        createArticleDetail({ id: ARTICLE_ID, title: 'Annonce', reactions }),
      ),
    ),
  );
  return renderApp(<ArticleDetail articleId={ARTICLE_ID} />);
}

/** Coupe `/v1/auth/me/` pour simuler un visiteur non connecté. */
function mockAnonymous() {
  server.use(
    http.get(`${env.API_URL}/v1/auth/me/`, () =>
      HttpResponse.json({ detail: 'Non authentifié.' }, { status: 401 }),
    ),
  );
}

describe('Réactions aux actualités', () => {
  test('affiche les trois réactions du SRS avec des libellés français', async () => {
    renderArticle();

    expect(
      await screen.findByRole('button', { name: /je prie/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /amen/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /je participe/i }),
    ).toBeInTheDocument();
  });

  test("l'état actif ne repose pas sur la couleur seule", async () => {
    renderArticle({ counts: { pray: 3, amen: 0, attend: 0 }, mine: ['pray'] });

    // Le libellé change (« Vous priez ») et l'état est exposé aux technologies
    // d'assistance : retirée la couleur, l'information reste lisible.
    const pray = await screen.findByRole('button', { name: /vous priez/i });
    expect(pray).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /amen/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('affiche le compteur de chaque réaction', async () => {
    renderArticle({ counts: { pray: 12, amen: 4, attend: 0 }, mine: [] });

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('bascule immédiatement au clic (mise à jour optimiste)', async () => {
    // Le serveur ne répond jamais : seul l'optimisme peut changer l'affichage.
    server.use(http.post(REACTIONS_URL, () => new Promise(() => {})));
    renderArticle();

    await userEvent.click(
      await screen.findByRole('button', { name: /je prie/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /vous priez/i }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test("revient en arrière ET prévient l'utilisateur quand l'envoi échoue", async () => {
    // Le cas qui a déjà coûté cher au projet : une action qui semble prise en
    // compte alors qu'elle a échoué. Le retour arrière doit être visible.
    server.use(
      http.post(REACTIONS_URL, () =>
        HttpResponse.json({ detail: 'Erreur serveur.' }, { status: 500 }),
      ),
    );
    renderArticle();

    await userEvent.click(
      await screen.findByRole('button', { name: /je prie/i }),
    );

    // 1. L'état optimiste est annulé.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /je prie/i })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    // 2. Et l'échec est annoncé, pas avalé.
    expect(
      await screen.findByText(/réaction non enregistrée/i),
    ).toBeInTheDocument();
  });

  test('le compteur revient à sa valeur initiale après un échec', async () => {
    server.use(
      http.post(REACTIONS_URL, () =>
        HttpResponse.json({ detail: 'Erreur serveur.' }, { status: 500 }),
      ),
    );
    renderArticle({ counts: { pray: 9, amen: 0, attend: 0 }, mine: [] });

    await userEvent.click(
      await screen.findByRole('button', { name: /je prie/i }),
    );

    await screen.findByText(/réaction non enregistrée/i);
    expect(await screen.findByText('9')).toBeInTheDocument();
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  test("adopte l'état renvoyé par le serveur après un succès", async () => {
    // Le serveur fait autorité : il intègre aussi les réactions des autres
    // fidèles arrivées entre-temps, que l'optimisme local ignore.
    server.use(
      http.post(REACTIONS_URL, () =>
        HttpResponse.json({
          counts: { pray: 0, amen: 0, attend: 42 },
          mine: ['attend'],
        }),
      ),
    );
    renderArticle();

    await userEvent.click(
      await screen.findByRole('button', { name: /je participe/i }),
    );

    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /vous participez/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('un retrait décrémente le compteur', async () => {
    server.use(
      http.post(REACTIONS_URL, () =>
        HttpResponse.json({
          counts: { pray: 4, amen: 0, attend: 0 },
          mine: [],
        }),
      ),
    );
    renderArticle({ counts: { pray: 5, amen: 0, attend: 0 }, mine: ['pray'] });

    await userEvent.click(
      await screen.findByRole('button', { name: /vous priez/i }),
    );

    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /je prie/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('envoie un état voulu explicite, pas une bascule', async () => {
    // Une bascule aveugle serait non-idempotente : un rejeu réseau inverserait
    // le résultat. Le client dit ce qu'il veut, pas « change ».
    const bodies: unknown[] = [];
    server.use(
      http.post(REACTIONS_URL, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({
          counts: { pray: 1, amen: 0, attend: 0 },
          mine: ['pray'],
        });
      }),
    );
    renderArticle();

    await userEvent.click(
      await screen.findByRole('button', { name: /je prie/i }),
    );

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ reaction_type: 'pray', active: true });
  });

  test('un retrait envoie active=false', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(REACTIONS_URL, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({
          counts: { pray: 0, amen: 0, attend: 0 },
          mine: [],
        });
      }),
    );
    renderArticle({ counts: { pray: 1, amen: 0, attend: 0 }, mine: ['pray'] });

    await userEvent.click(
      await screen.findByRole('button', { name: /vous priez/i }),
    );

    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ reaction_type: 'pray', active: false });
  });

  test('un visiteur non connecté voit les compteurs sans bouton qui échoue', async () => {
    mockAnonymous();
    renderArticle({ counts: { pray: 7, amen: 0, attend: 0 }, mine: [] });

    expect(await screen.findByText('7')).toBeInTheDocument();
    expect(screen.getByText(/connectez-vous pour réagir/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /je prie/i }),
    ).not.toBeInTheDocument();
  });

  test('tolère un article servi sans bloc reactions', async () => {
    // Réponse antérieure au déploiement du champ : on affiche zéro plutôt que
    // de faire échouer le parse de l'article.
    renderArticle(undefined);

    expect(
      await screen.findByRole('button', { name: /je prie/i }),
    ).toHaveAttribute('aria-pressed', 'false');
  });
});
