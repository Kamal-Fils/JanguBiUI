import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createRosaryDay, createRosaryGroup } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { DailyMysteryCard } from '../daily-mystery-card';

describe('DailyMysteryCard', () => {
  test('shows loading spinner while fetching rosary data', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/rosary/today/`, async () => {
        await delay(Infinity);
        return HttpResponse.json(createRosaryDay());
      }),
    );

    renderApp(<DailyMysteryCard />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
  });

  test('shows mystery name and weekday after loading', async () => {
    const rosaryDay = createRosaryDay({
      day: {
        id: 1,
        weekday_display: 'Lundi',
        group: createRosaryGroup({ name: 'Joyeux' }),
      },
    });
    server.use(
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(rosaryDay),
      ),
    );

    renderApp(<DailyMysteryCard />);

    await screen.findByText(/mystères joyeux/i);
    expect(screen.getByText('Lundi')).toBeInTheDocument();
  });

  test('shows error message when rosary request fails', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/rosary/today/`, () => HttpResponse.error()),
    );

    renderApp(<DailyMysteryCard />);

    await screen.findByText(/erreur lors du chargement du chapelet du jour/i);
  });

  test('shows "Commencer le chapelet" link pointing to /app/chapelet', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<DailyMysteryCard />);

    const link = await screen.findByRole('link', {
      name: /commencer le chapelet/i,
    });
    expect(link).toHaveAttribute('href', '/app/chapelet');
  });
});
