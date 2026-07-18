import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { createClergyUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, userEvent } from '@/testing/test-utils';

import { CommunityRosaryList } from '../community-rosary-list';

const COMMUNITY_URL = `${env.API_URL}/v1/rosary/community/`;

const activeRosary = {
  id: 1,
  initiator_email: 'pretre@jangubi.sn',
  mystery_group_name: 'Mystères Joyeux',
  intention: 'Pour la paix au Sénégal',
  status: 'active' as const,
  current_decade: 2,
  started_at: new Date().toISOString(),
};

describe('CommunityRosaryList', () => {
  test('shows an inviting empty state when no rosary is in progress', async () => {
    server.use(http.get(COMMUNITY_URL, () => HttpResponse.json([])));

    renderApp(<CommunityRosaryList onJoin={vi.fn()} />);

    expect(
      await screen.findByText(/aucun chapelet en cours/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/prier ensemble, au même moment/i),
    ).toBeInTheDocument();
  });

  test('lists active rosaries and joining calls onJoin with the rosary', async () => {
    const onJoin = vi.fn();
    server.use(
      http.get(COMMUNITY_URL, () => HttpResponse.json([activeRosary])),
    );

    renderApp(<CommunityRosaryList onJoin={onJoin} />);

    expect(await screen.findByText('Mystères Joyeux')).toBeInTheDocument();
    expect(screen.getByText('Pour la paix au Sénégal')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /rejoindre/i }));

    expect(onJoin).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1, current_decade: 2 }),
    );
  });

  test('shows an error state with retry when loading fails', async () => {
    let calls = 0;
    server.use(
      http.get(COMMUNITY_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ detail: 'Erreur' }, { status: 500 });
        }
        return HttpResponse.json([]);
      }),
    );

    renderApp(<CommunityRosaryList onJoin={vi.fn()} />);

    expect(
      await screen.findByText(/impossible de charger les chapelets/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(
      await screen.findByText(/aucun chapelet en cours/i),
    ).toBeInTheDocument();
  });

  test('does not offer to start a rosary to a lay fidèle', async () => {
    server.use(http.get(COMMUNITY_URL, () => HttpResponse.json([])));

    renderApp(<CommunityRosaryList onJoin={vi.fn()} />);

    await screen.findByText(/aucun chapelet en cours/i);
    expect(
      screen.queryByText(/initier un chapelet communautaire/i),
    ).not.toBeInTheDocument();
  });

  test('clergy can start a rosary with an intention', async () => {
    const onJoin = vi.fn();
    server.use(
      http.get(`${env.API_URL}/v1/auth/me/`, () =>
        HttpResponse.json(createClergyUser('pretre')),
      ),
      http.get(COMMUNITY_URL, () => HttpResponse.json([])),
      http.post(COMMUNITY_URL, async ({ request }) => {
        const body = (await request.json()) as { intention?: string };
        return HttpResponse.json({
          ...activeRosary,
          id: 7,
          intention: body.intention ?? '',
          current_decade: 1,
        });
      }),
    );

    renderApp(<CommunityRosaryList onJoin={onJoin} />);

    expect(
      await screen.findByText(/initier un chapelet communautaire/i),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByLabelText(/intention de prière/i),
      'Pour les vocations',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /démarrer le chapelet/i }),
    );

    await vi.waitFor(() => {
      expect(onJoin).toHaveBeenCalledWith(
        expect.objectContaining({ id: 7, intention: 'Pour les vocations' }),
      );
    });
  });

  test('shows an inline error when starting the rosary fails', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/auth/me/`, () =>
        HttpResponse.json(createClergyUser('religieux')),
      ),
      http.get(COMMUNITY_URL, () => HttpResponse.json([])),
      http.post(COMMUNITY_URL, () =>
        HttpResponse.json({ detail: 'Erreur' }, { status: 500 }),
      ),
    );

    renderApp(<CommunityRosaryList onJoin={vi.fn()} />);

    await screen.findByText(/initier un chapelet communautaire/i);
    await userEvent.click(
      screen.getByRole('button', { name: /démarrer le chapelet/i }),
    );

    expect(
      await screen.findByText(/impossible de démarrer le chapelet/i),
    ).toBeInTheDocument();
  });
});
