import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { Event } from '../../api/get-events';
import { AdminEventList } from '../admin-event-list';

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
    max_participants: 50,
    registration_count: 3,
    is_registered: false,
    created_at: '2026-06-01T08:00:00Z',
    ...overrides,
  };
}

/**
 * Les actions par ligne vivent dans un menu « ⋯ » — on l'ouvre avant d'asserter.
 * La DataTable rend chaque ligne deux fois (table desktop + carte mobile,
 * départagées par CSS que jsdom n'applique pas) : on ouvre le premier menu.
 */
async function openRowActions(eventTitle: string) {
  const [trigger] = await screen.findAllByRole('button', {
    name: `Actions pour ${eventTitle}`,
  });
  await userEvent.click(trigger);
}

describe('AdminEventList', () => {
  test('affiche titre, type et portée (libellés du fil actus)', async () => {
    renderApp(<AdminEventList events={[makeEvent()]} />);

    expect(
      (await screen.findAllByText('Messe de la Pentecôte')).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Messe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Paroisse').length).toBeGreaterThan(0);
  });

  test('le menu « ⋯ » propose Voir et Supprimer', async () => {
    renderApp(<AdminEventList events={[makeEvent()]} />);

    await openRowActions('Messe de la Pentecôte');

    expect(
      await screen.findByRole('menuitem', { name: 'Voir' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Supprimer' }),
    ).toBeInTheDocument();
  });

  test('supprimer : confirmation via dialogue puis notification de succès', async () => {
    server.use(
      http.delete(`${env.API_URL}/v1/agenda/events/1/`, () =>
        HttpResponse.json(null, { status: 200 }),
      ),
    );

    renderApp(<AdminEventList events={[makeEvent()]} />);

    await openRowActions('Messe de la Pentecôte');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Supprimer' }),
    );

    // Le dialogue de confirmation s'ouvre — on confirme.
    expect(
      await screen.findByText(/Cette action\s+est irréversible/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(
      await screen.findByText("L'événement a été supprimé."),
    ).toBeInTheDocument();
  });

  test('liste vide → EmptyState incitatif', async () => {
    renderApp(<AdminEventList events={[]} />);

    expect(
      await screen.findByText('Aucun événement au programme'),
    ).toBeInTheDocument();
  });
});
