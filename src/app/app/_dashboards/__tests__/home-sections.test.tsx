import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { paths } from '@/config/paths';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { MyIntentionsSection } from '../my-intentions-section';
import { ParishEventsSection } from '../parish-events-section';
import { ParishNewsSection } from '../parish-news-section';

const NEWS_URL = `${env.API_URL}/v1/news/my-parish/`;
const EVENTS_URL = `${env.API_URL}/v1/agenda/events/`;
const INTENTIONS_URL = `${env.API_URL}/v1/mass-intentions/my/`;

const emptyPage = () => HttpResponse.json({ count: 0, results: [] });
const boom = () => new HttpResponse(null, { status: 500 });

/**
 * Ces sections échouaient en silence : sans état d'erreur, une panne réseau se
 * lisait « aucune actualité » / « aucun événement prévu ». Le fidèle croyait sa
 * paroisse muette au lieu de pouvoir réessayer.
 */
describe('ParishNewsSection', () => {
  test('une panne affiche une erreur récupérable, pas un état vide', async () => {
    server.use(http.get(NEWS_URL, boom));
    renderApp(<ParishNewsSection />);

    expect(
      await screen.findByText(/actualités indisponibles/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/rien de neuf/i)).not.toBeInTheDocument();
  });

  test('sans actualité, l’état vide ne se fait pas passer pour une erreur', async () => {
    server.use(http.get(NEWS_URL, emptyPage));
    renderApp(<ParishNewsSection />);

    expect(await screen.findByText(/rien de neuf/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/actualités indisponibles/i),
    ).not.toBeInTheDocument();
  });
});

describe('ParishEventsSection', () => {
  test('une panne affiche une erreur récupérable, pas un état vide', async () => {
    server.use(http.get(EVENTS_URL, boom));
    renderApp(<ParishEventsSection />);

    expect(await screen.findByText(/agenda indisponible/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/aucun événement à venir/i),
    ).not.toBeInTheDocument();
  });

  test('sans événement, l’état vide ne se fait pas passer pour une erreur', async () => {
    server.use(http.get(EVENTS_URL, emptyPage));
    renderApp(<ParishEventsSection />);

    expect(
      await screen.findByText(/aucun événement à venir/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/agenda indisponible/i)).not.toBeInTheDocument();
  });

  test('ne demande au serveur que les trois événements affichés', async () => {
    // La troncature est demandée AU SERVEUR : l'accueil rapatriait auparavant
    // l'agenda complet pour n'en montrer que trois.
    let requestedLimit: string | null = null;
    const results = Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      title: `Événement ${i + 1}`,
      description: '',
      event_type: 'messe',
      start_at: '2099-01-0' + (i + 1) + 'T10:00:00Z',
      end_at: '2099-01-0' + (i + 1) + 'T11:00:00Z',
      location: '',
      scope_type: 'parish',
      scope_id: 1,
      max_participants: null,
      organizer_email: null,
      registration_count: 0,
      is_registered: false,
      created_at: '2026-01-01T10:00:00Z',
    }));
    server.use(
      http.get(EVENTS_URL, ({ request }) => {
        requestedLimit = new URL(request.url).searchParams.get('limit');
        return HttpResponse.json({ count: 12, results });
      }),
    );
    renderApp(<ParishEventsSection />);

    expect(await screen.findByText('Événement 1')).toBeInTheDocument();
    expect(screen.getByText('Événement 3')).toBeInTheDocument();
    expect(requestedLimit).toBe('3');
  });
});

describe('MyIntentionsSection', () => {
  test('une panne affiche une erreur récupérable', async () => {
    server.use(http.get(INTENTIONS_URL, boom));
    renderApp(<MyIntentionsSection />);

    expect(
      await screen.findByText(/intentions indisponibles/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
  });

  test('propose de déposer une intention via `paths`, pas une URL en dur', async () => {
    server.use(http.get(INTENTIONS_URL, emptyPage));
    renderApp(<MyIntentionsSection />);

    expect(
      await screen.findByRole('link', { name: /déposer une intention/i }),
    ).toHaveAttribute('href', paths.app.intentions.getHref());
  });
});
