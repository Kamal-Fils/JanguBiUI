import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from 'next/navigation';

import { renderApp } from '@/testing/test-utils';

import { AppHeader } from '../app-header';
import { PageMetaProvider, useRegisterPageMeta } from '../page-meta';

// La cloche tape l'API des notifications — hors sujet pour le header.
vi.mock('@/components/layouts/notification-bell', () => ({
  NotificationBell: () => <button type="button" aria-label="Notifications" />,
}));

const mockBack = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  back: mockBack,
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
} as never);

function MetaRegistrar({ title }: { title: string }) {
  useRegisterPageMeta({ title });
  return null;
}

function renderHeader(pathname: string, title?: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return renderApp(
    <PageMetaProvider>
      {title && <MetaRegistrar title={title} />}
      <AppHeader />
    </PageMetaProvider>,
  );
}

describe('AppHeader (shell — 1C)', () => {
  beforeEach(() => mockBack.mockReset());

  test('ne rend rien tant qu’aucune page n’enregistre de meta', () => {
    const { container } = renderHeader('/app/actus/article-1');
    // eslint-disable-next-line testing-library/no-node-access
    expect(container.querySelector('header')).toBeNull();
  });

  test('affiche le fil d’Ariane d’une route profonde', async () => {
    renderHeader('/app/actus/article-1', 'Mon Article');

    // Le crumb parent est un lien, la feuille est le titre.
    expect(
      await screen.findByRole('link', { name: 'Actus' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Mon Article').length).toBeGreaterThan(0);
  });

  test('le bouton retour appelle router.back() sur une route profonde', async () => {
    renderHeader('/app/documents/req-1', 'Demande de document');

    const back = await screen.findByRole('button', { name: /retour/i });
    await userEvent.click(back);

    expect(mockBack).toHaveBeenCalledOnce();
  });
});
