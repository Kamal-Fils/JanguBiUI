import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, userEvent } from '@/testing/test-utils';

import type { Book } from '../../api/get-books';
import { ChapterReading } from '../chapter-reading';

const BOOK = {
  id: 1,
  name: 'Genèse',
  slug: 'gn',
  order: 1,
  testament: 'ancien',
  chapter_count: 50,
} as Book;

const VERSES_URL = `${env.API_URL}/v1/bible/books/1/chapters/1/verses/`;

describe('ChapterReading (archétype Lecture)', () => {
  test('rend le chapitre : livre, numéro et versets numérotés', async () => {
    server.use(
      http.get(VERSES_URL, () =>
        HttpResponse.json({
          results: [
            {
              id: 1,
              number: 1,
              text: 'Au commencement, Dieu créa le ciel et la terre.',
            },
            { id: 2, number: 2, text: 'La terre était informe et vide.' },
          ],
        }),
      ),
    );

    renderApp(
      <ChapterReading book={BOOK} chapterNumber={1} onBack={() => {}} />,
    );

    expect(
      await screen.findByText(/Au commencement, Dieu créa le ciel/),
    ).toBeInTheDocument();
    expect(screen.getByText('Genèse')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Chapitre 1' }),
    ).toBeInTheDocument();
    // Le réglage de taille reste accessible pendant la lecture (R3).
    expect(
      screen.getByRole('group', { name: /taille du texte/i }),
    ).toBeInTheDocument();
  });

  test('la colonne de texte porte seule la mesure de lecture (pas de recentrage)', async () => {
    server.use(
      http.get(VERSES_URL, () =>
        HttpResponse.json({
          results: [{ id: 1, number: 1, text: 'Un verset de test.' }],
        }),
      ),
    );

    renderApp(
      <ChapterReading book={BOOK} chapterNumber={1} onBack={() => {}} />,
    );

    const verse = await screen.findByText(/Un verset de test/);
    const column = verse.closest('div');
    // ~68ch sur la colonne de TEXTE ; jamais de `mx-auto` qui recentrerait et
    // laisserait deux bandes mortes (retour client sur la largeur de la Bible).
    expect(column).toHaveClass('max-w-reading');
    expect(column?.className).not.toContain('mx-auto');
  });

  test("erreur serveur : l'erreur est récupérable et réessayer recharge", async () => {
    let calls = 0;
    server.use(
      http.get(VERSES_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ detail: 'Erreur' }, { status: 500 });
        }
        return HttpResponse.json({
          results: [{ id: 9, number: 1, text: 'Le texte est revenu.' }],
        });
      }),
    );

    renderApp(
      <ChapterReading book={BOOK} chapterNumber={1} onBack={() => {}} />,
    );

    expect(
      await screen.findByText('Ce chapitre n’a pas pu être chargé'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(await screen.findByText(/Le texte est revenu/)).toBeInTheDocument();
  });

  test('chapitre sans verset : état vide qui explique et oriente', async () => {
    server.use(http.get(VERSES_URL, () => HttpResponse.json({ results: [] })));

    renderApp(
      <ChapterReading book={BOOK} chapterNumber={1} onBack={() => {}} />,
    );

    expect(
      await screen.findByText('Ce chapitre est encore vide'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Choisissez un autre chapitre/),
    ).toBeInTheDocument();
  });

  test('le retour aux chapitres est proposé et appelle onBack', async () => {
    server.use(
      http.get(VERSES_URL, () =>
        HttpResponse.json({
          results: [{ id: 1, number: 1, text: 'Verset.' }],
        }),
      ),
    );
    const onBack = vi.fn();

    renderApp(<ChapterReading book={BOOK} chapterNumber={1} onBack={onBack} />);

    await userEvent.click(
      screen.getByRole('button', { name: /retour aux chapitres/i }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
