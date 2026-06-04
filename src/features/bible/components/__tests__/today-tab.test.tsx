import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createLiturgyDay, createRosaryDay } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { TodayTab } from '../today-tab';

describe('TodayTab', () => {
  test('shows the current date', async () => {
    renderApp(<TodayTab />);

    // The date should be visible as formatted text (capitalize locale)
    const today = new Date();
    const monthName = today.toLocaleDateString('fr-FR', { month: 'long' });
    await screen.findByText(new RegExp(monthName, 'i'));
  });

  test('shows liturgical readings after loading', async () => {
    const liturgyDay = createLiturgyDay({
      readings: [
        {
          id: 'r1',
          type: 'Première Lecture',
          citation: 'Is 55, 10-11',
          text: '<p>Comme la pluie...</p>',
        },
        {
          id: 'r2',
          type: 'Évangile',
          citation: 'Mt 6, 7-15',
          text: '<p>Notre Père...</p>',
        },
      ],
    });
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(liturgyDay),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    // ReadingsSwiper renders tab buttons with normalized labels
    await screen.findByRole('tab', { name: 'Première Lecture' });
    expect(screen.getByRole('tab', { name: 'Évangile' })).toBeInTheDocument();
    expect(screen.getByText('Is 55, 10-11')).toBeInTheDocument();
    expect(screen.getByText('Mt 6, 7-15')).toBeInTheDocument();
  });

  test('shows "Aucune lecture disponible" when readings array is empty', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(createLiturgyDay({ readings: [] })),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    await screen.findByText(/aucune lecture disponible/i);
  });

  test('shows swipeable tab buttons for each reading', async () => {
    const liturgyDay = createLiturgyDay({
      readings: [
        {
          id: 'r1',
          type: 'lecture1',
          citation: 'Is 6, 1-8',
          text: '<p>Contenu première lecture.</p>',
        },
        {
          id: 'r2',
          type: 'gospel',
          citation: 'Lc 5, 1-11',
          text: '<p>Contenu évangile.</p>',
        },
      ],
    });
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(liturgyDay),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    // ReadingsSwiper renders tab buttons with normalized labels
    await screen.findByRole('tab', { name: 'Première Lecture' });
    expect(screen.getByRole('tab', { name: 'Évangile' })).toBeInTheDocument();
    // Citations are rendered in the panels (all panels are in the DOM)
    expect(screen.getByText('Is 6, 1-8')).toBeInTheDocument();
    expect(screen.getByText('Lc 5, 1-11')).toBeInTheDocument();
  });

  test('clicking a tab button does not throw', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/liturgy/today/`, () =>
        HttpResponse.json(createLiturgyDay()),
      ),
      http.get(`${env.API_URL}/v1/rosary/today/`, () =>
        HttpResponse.json(createRosaryDay()),
      ),
    );

    renderApp(<TodayTab />);

    // Wait for swiper tabs to appear then click the second one
    const psaumeTab = await screen.findByRole('tab', { name: 'Psaume' });
    await userEvent.click(psaumeTab);
    // scrollTo is not supported in jsdom but the click must not throw
    expect(psaumeTab).toBeInTheDocument();
  });
});
