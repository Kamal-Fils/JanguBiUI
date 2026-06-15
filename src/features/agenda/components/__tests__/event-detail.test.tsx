import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { Event } from '../../api/get-events';
import { EventDetail } from '../event-detail';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 1,
    title: 'Messe de la Pentecôte',
    description:
      'Grande célébration à 10h, suivie d’un repas paroissial.\nVenez nombreux.',
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

const detailUrl = `${env.API_URL}/v1/agenda/events/1/`;

describe('EventDetail', () => {
  test('affiche la description COMPLÈTE (non tronquée) après chargement', async () => {
    server.use(http.get(detailUrl, () => HttpResponse.json(makeEvent())));

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByRole('heading', { name: 'Messe de la Pentecôte' }),
    ).toBeInTheDocument();
    expect(await screen.findByText(/repas paroissial/i)).toBeInTheDocument();
    expect(screen.getByText(/Venez nombreux/i)).toBeInTheDocument();
  });

  test('affiche le lieu et l’organisateur', async () => {
    server.use(
      http.get(detailUrl, () =>
        HttpResponse.json(
          makeEvent({ organizer_email: 'pere.senghor@jangubidev.sn' }),
        ),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByText('Cathédrale du Souvenir Africain'),
    ).toBeInTheDocument();
    expect(screen.getByText('pere.senghor@jangubidev.sn')).toBeInTheDocument();
  });

  test('état « Événement introuvable » sur 404', async () => {
    server.use(
      http.get(detailUrl, () =>
        HttpResponse.json({ message: 'Not found.' }, { status: 404 }),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByText('Événement introuvable.'),
    ).toBeInTheDocument();
  });

  test('le bouton « S’inscrire » déclenche l’inscription', async () => {
    server.use(
      http.get(detailUrl, () => HttpResponse.json(makeEvent())),
      http.post(`${env.API_URL}/v1/agenda/events/1/register/`, () =>
        HttpResponse.json({}, { status: 201 }),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    const btn = await screen.findByRole('button', { name: "S'inscrire" });
    await userEvent.click(btn);

    expect(
      await screen.findByText('Votre inscription est confirmée.'),
    ).toBeInTheDocument();
  });

  test('affiche « Annuler mon inscription » quand déjà inscrit', async () => {
    server.use(
      http.get(detailUrl, () =>
        HttpResponse.json(makeEvent({ is_registered: true })),
      ),
    );

    renderApp(<EventDetail eventId={1} />);

    expect(
      await screen.findByRole('button', { name: 'Annuler mon inscription' }),
    ).toBeInTheDocument();
  });
});
