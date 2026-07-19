import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { getLiturgicalTone } from '../utils/liturgical-color';
import { WordOfTheDay } from '../word-of-the-day';

const LITURGY_URL = `${env.API_URL}/v1/liturgy/today/`;

function mockDay(overrides: Record<string, unknown> = {}) {
  server.use(
    http.get(LITURGY_URL, () =>
      HttpResponse.json({
        season: 'Temps ordinaire',
        day_name: 'Mercredi de la 16e semaine',
        readings: [
          { id: 1, type: '1ère lecture', citation: 'Jr 1, 1-10' },
          { id: 2, type: 'Psaume', citation: 'Ps 70' },
          { id: 3, type: 'Alléluia', citation: 'Jn 15' },
          { id: 4, type: 'Évangile', citation: 'Mt 13, 1-9' },
        ],
        ...overrides,
      }),
    ),
  );
}

describe('getLiturgicalTone — la couleur suit le temps liturgique', () => {
  test('violet pour l’attente et la pénitence', () => {
    expect(getLiturgicalTone('Avent').color).toBe('violet');
    expect(getLiturgicalTone('Temps du Carême').color).toBe('violet');
  });

  test('blanc/or pour les temps de joie', () => {
    expect(getLiturgicalTone('Temps de Noël').color).toBe('white');
    expect(getLiturgicalTone('Temps pascal').color).toBe('white');
  });

  test('rouge pour l’Esprit et les martyrs', () => {
    expect(getLiturgicalTone('Pentecôte').color).toBe('red');
    expect(getLiturgicalTone('Dimanche des Rameaux').color).toBe('red');
  });

  test('vert pour le temps ordinaire', () => {
    expect(getLiturgicalTone('Temps ordinaire').color).toBe('green');
  });

  test('sans information, repli sur le temps ordinaire — jamais une fête', () => {
    const tone = getLiturgicalTone(null);

    expect(tone.color).toBe('green');
    expect(tone.label).toBe('Temps ordinaire');
  });

  test('le Carême prime sur une mention de Pâques dans le même libellé', () => {
    // « Temps du Carême » précède Pâques : l'ordre des règles compte.
    expect(getLiturgicalTone('Carême — vers Pâques').color).toBe('violet');
  });
});

describe('WordOfTheDay', () => {
  test('la Parole du jour est le titre de la page, pas le prénom', async () => {
    mockDay();
    renderApp(<WordOfTheDay />);

    expect(
      await screen.findByRole('heading', { level: 1, name: /la parole du jour/i }),
    ).toBeInTheDocument();
  });

  test('met l’Évangile en exergue et liste les autres lectures', async () => {
    mockDay();
    renderApp(<WordOfTheDay />);

    expect(await screen.findByText('Mt 13, 1-9')).toBeInTheDocument();
    expect(screen.getByText('Jr 1, 1-10')).toBeInTheDocument();
    expect(screen.getByText('Ps 70')).toBeInTheDocument();
  });

  test('l’alléluia n’est pas listé comme une lecture', async () => {
    mockDay();
    renderApp(<WordOfTheDay />);

    await screen.findByText('Mt 13, 1-9');
    expect(screen.queryByText('Jn 15')).not.toBeInTheDocument();
  });

  test('les lectures mènent à la liturgie du jour', async () => {
    // L'ancien lien pointait vers un onglet Bible supprimé depuis : le clic
    // atterrissait sur la liste des livres au lieu du texte du jour.
    mockDay();
    renderApp(<WordOfTheDay />);

    const lien = await screen.findByRole('link', { name: /lire l’évangile/i });
    expect(lien).toHaveAttribute('href', '/app/spirituel/liturgie');
  });

  test('affiche le temps liturgique en surtitre', async () => {
    mockDay({ season: 'Temps de l’Avent' });
    renderApp(<WordOfTheDay />);

    expect(await screen.findByText(/temps de l’avent/i)).toBeInTheDocument();
  });

  test('sans lectures disponibles, propose d’ouvrir la liturgie', async () => {
    mockDay({ readings: [] });
    renderApp(<WordOfTheDay />);

    expect(
      await screen.findByRole('link', { name: /ouvrir la liturgie/i }),
    ).toBeInTheDocument();
  });
});
