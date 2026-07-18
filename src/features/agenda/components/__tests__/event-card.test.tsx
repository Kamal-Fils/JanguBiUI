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
