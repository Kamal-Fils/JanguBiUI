import { renderApp, screen } from '@/testing/test-utils';

import { DailyReadingCard } from '../daily-reading-card';

// La carte est branchée sur GET /v1/liturgy/today/ (handler MSW bible.ts) —
// plus aucune référence codée en dur (retour testeurs n°1).
describe('DailyReadingCard', () => {
  test('renders the "La Parole du jour" heading', () => {
    renderApp(<DailyReadingCard />);

    expect(
      screen.getByRole('heading', { name: /la parole du jour/i }),
    ).toBeInTheDocument();
  });

  test('renders the readings returned by the API', async () => {
    renderApp(<DailyReadingCard />);

    expect(await screen.findByText('Première Lecture')).toBeInTheDocument();
    expect(screen.getByText('Psaume')).toBeInTheDocument();
    expect(screen.getByText('Évangile')).toBeInTheDocument();
  });

  test('renders reading references from the API', async () => {
    renderApp(<DailyReadingCard />);

    expect(await screen.findByText(/Is 55/i)).toBeInTheDocument();
    expect(screen.getByText(/Mt 6/i)).toBeInTheDocument();
  });

  test('each reading links to the Bible "Aujourd\'hui" tab', async () => {
    renderApp(<DailyReadingCard />);

    await screen.findByText('Première Lecture');
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/app/bible?tab=aujourdhui');
    });
  });

  test('renders the "Aujourd\'hui" badge', () => {
    renderApp(<DailyReadingCard />);

    expect(screen.getByText(/aujourd'hui/i)).toBeInTheDocument();
  });
});
