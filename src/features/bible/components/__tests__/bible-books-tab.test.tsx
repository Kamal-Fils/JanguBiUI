import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, userEvent } from '@/testing/test-utils';

import { BibleBooksTab } from '../bible-books-tab';

const BOOKS_URL = `${env.API_URL}/v1/bible/books/`;

describe('BibleBooksTab (navigation Bible)', () => {
  test('rend la recherche, les testaments et la liste des livres', async () => {
    server.use(
      http.get(BOOKS_URL, () =>
        HttpResponse.json({
          results: [
            {
              id: 1,
              name: 'Genèse',
              slug: 'gn',
              order: 1,
              testament: 'ancien',
              chapter_count: 50,
            },
          ],
        }),
      ),
    );

    renderApp(<BibleBooksTab />);

    expect(
      await screen.findByRole('button', { name: /Genèse/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('50 chapitres')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/rechercher dans la bible/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ancien Testament' }),
    ).toBeInTheDocument();
  });

  test("erreur de chargement : l'erreur est récupérable et réessayer recharge", async () => {
    let calls = 0;
    server.use(
      http.get(BOOKS_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ detail: 'Erreur' }, { status: 500 });
        }
        return HttpResponse.json({
          results: [
            {
              id: 1,
              name: 'Genèse',
              slug: 'gn',
              order: 1,
              testament: 'ancien',
              chapter_count: 50,
            },
          ],
        });
      }),
    );

    renderApp(<BibleBooksTab />);

    expect(
      await screen.findByText('Les livres n’ont pas pu être chargés'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(
      await screen.findByRole('button', { name: /Genèse/ }),
    ).toBeInTheDocument();
  });

  test('aucun livre : état vide qui oriente au lieu de constater', async () => {
    server.use(http.get(BOOKS_URL, () => HttpResponse.json({ results: [] })));

    renderApp(<BibleBooksTab />);

    expect(
      await screen.findByText('Aucun livre dans cette section'),
    ).toBeInTheDocument();
    expect(screen.getByText(/Choisissez un autre testament/)).toBeInTheDocument();
  });

  test('choisir un livre ouvre le sélecteur de chapitres', async () => {
    server.use(
      http.get(BOOKS_URL, () =>
        HttpResponse.json({
          results: [
            {
              id: 1,
              name: 'Genèse',
              slug: 'gn',
              order: 1,
              testament: 'ancien',
              chapter_count: 3,
            },
          ],
        }),
      ),
    );

    renderApp(<BibleBooksTab />);

    await userEvent.click(await screen.findByRole('button', { name: /Genèse/ }));

    expect(
      screen.getByRole('heading', { name: 'Genèse' }),
    ).toBeInTheDocument();
    // Les 3 chapitres sont proposés en cibles directes (un appui = un chapitre).
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });
});
