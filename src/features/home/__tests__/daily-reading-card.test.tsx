import { renderApp, screen } from '@/testing/test-utils';

import { DailyReadingCard } from '../daily-reading-card';

describe('DailyReadingCard', () => {
  test('renders the "Lectures du jour" title', () => {
    renderApp(<DailyReadingCard />);

    expect(screen.getByText(/lectures du jour/i)).toBeInTheDocument();
  });

  test('renders reading items', () => {
    renderApp(<DailyReadingCard />);

    expect(screen.getByText('1ère Lecture')).toBeInTheDocument();
    expect(screen.getByText('Psaume')).toBeInTheDocument();
    expect(screen.getByText('Évangile')).toBeInTheDocument();
  });

  test('renders reading references', () => {
    renderApp(<DailyReadingCard />);

    expect(screen.getByText(/Isaïe 55/i)).toBeInTheDocument();
    expect(screen.getByText(/Matthieu/i)).toBeInTheDocument();
  });

  test('each reading links to /app/bible', () => {
    renderApp(<DailyReadingCard />);

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/app/bible');
    });
  });

  test('renders the "Aujourd\'hui" badge', () => {
    renderApp(<DailyReadingCard />);

    expect(screen.getByText(/aujourd'hui/i)).toBeInTheDocument();
  });
});
