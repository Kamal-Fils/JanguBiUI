import { screen } from '@testing-library/react';

import { renderApp } from '@/testing/test-utils';

import type { Event } from '../../api/get-events';
import { EventCard } from '../event-card';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    title: 'Messe de la Pentecôte',
    description: 'Grande célébration à 10h.',
    event_type: 'mass',
    start_at: '2026-06-10T10:00:00Z',
    end_at: '2026-06-10T12:00:00Z',
    location: 'Cathédrale du Souvenir Africain',
    scope_type: 'parish',
    registration_count: 3,
    is_registered: false,
    created_at: '2026-06-01T08:00:00Z',
    ...overrides,
  };
}

describe('EventCard', () => {
  test('affiche le type et la portée (libellés du fil actus)', async () => {
    renderApp(<EventCard event={makeEvent()} />);

    expect(await screen.findByText('Messe')).toBeInTheDocument();
    expect(screen.getByText('Paroisse')).toBeInTheDocument();
  });

  test('portée diocésaine → libellé « Diocèse »', async () => {
    renderApp(<EventCard event={makeEvent({ scope_type: 'diocese' })} />);

    expect(await screen.findByText('Diocèse')).toBeInTheDocument();
  });

  test('portée inconnue → repli sur la valeur brute', async () => {
    renderApp(<EventCard event={makeEvent({ scope_type: 'doyenne' })} />);

    expect(await screen.findByText('doyenne')).toBeInTheDocument();
  });

  test("le bouton « S'inscrire » est proposé quand non inscrit", async () => {
    renderApp(<EventCard event={makeEvent()} />);

    expect(
      await screen.findByRole('button', { name: "S'inscrire" }),
    ).toBeInTheDocument();
  });
});

/**
 * Le fil agenda se lit en trois mouvements de densité décroissante
 * (DIRECTION R6, archétype Flux) : la proximité dans le temps *est*
 * l'importance. Ces tests fixent ce que chaque mouvement doit porter.
 */
describe('EventCard — rythme du fil', () => {
  test('la une porte la description complète et l’inscription', async () => {
    renderApp(
      <EventCard
        event={makeEvent({ description: 'Grande célébration à 10h.' })}
        variant="lead"
      />,
    );

    expect(
      await screen.findByRole('heading', { name: /messe de la pentecôte/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Grande célébration à 10h.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: "S'inscrire" }),
    ).toBeInTheDocument();
  });

  test('la brève tient sur une ligne et renvoie au détail, sans inscription', async () => {
    renderApp(<EventCard event={makeEvent()} variant="brief" />);

    const link = await screen.findByRole('link', {
      name: /messe de la pentecôte/i,
    });
    expect(link).toHaveAttribute('href', '/app/agenda/1');

    // On ne s'engage pas sur une date lointaine depuis une brève.
    expect(
      screen.queryByRole('button', { name: "S'inscrire" }),
    ).not.toBeInTheDocument();
    // Ni description : la brève est typographique, pas narrative.
    expect(
      screen.queryByText('Grande célébration à 10h.'),
    ).not.toBeInTheDocument();
  });

  test('la bande reste le défaut — l’accueil du fidèle n’a pas à le préciser', async () => {
    const { rerender } = renderApp(<EventCard event={makeEvent()} />);
    const withDefault = await screen.findByRole('button', {
      name: "S'inscrire",
    });
    expect(withDefault).toBeInTheDocument();

    rerender(<EventCard event={makeEvent()} variant="band" />);
    expect(
      screen.getByRole('button', { name: "S'inscrire" }),
    ).toBeInTheDocument();
  });
});
