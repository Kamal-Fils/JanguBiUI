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
const mockPush = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  back: mockBack,
  push: mockPush,
  replace: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
} as never);

function MetaRegistrar({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  useRegisterPageMeta({ title, backHref });
  return null;
}

function renderHeader(pathname: string, title?: string, backHref?: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return renderApp(
    <PageMetaProvider>
      {title && <MetaRegistrar title={title} backHref={backHref} />}
      <AppHeader />
    </PageMetaProvider>,
  );
}

describe('AppHeader (shell — 1C)', () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockPush.mockReset();
  });

  test('ne rend rien tant qu’aucune page n’enregistre de meta', () => {
    const { container } = renderHeader('/app/actus/article-1');
    // eslint-disable-next-line testing-library/no-node-access
    expect(container.querySelector('header')).toBeNull();
  });

  test('affiche le fil d’Ariane d’une route profonde', async () => {
    renderHeader('/app/actus/article-1', 'Mon Article');

    // Le crumb parent est un lien, la feuille est le titre.
    expect(
      await screen.findByRole('link', { name: 'Actualité' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Mon Article').length).toBeGreaterThan(0);
  });

  test('le bouton retour appelle router.back() sur une route profonde', async () => {
    renderHeader('/app/documents/req-1', 'Demande de document');

    const back = await screen.findByRole('button', { name: /retour/i });
    await userEvent.click(back);

    expect(mockBack).toHaveBeenCalledOnce();
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('backHref navigue vers le parent logique au lieu de router.back()', async () => {
    renderHeader(
      '/app/chapelet/communautaire',
      'Chapelet communautaire',
      '/app/chapelet',
    );

    const back = await screen.findByRole('button', { name: /retour/i });
    await userEvent.click(back);

    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith('/app/chapelet');
    expect(mockBack).not.toHaveBeenCalled();
  });

  test("backHref force l'affordance retour même hors route profonde", async () => {
    // /app/dons n'a qu'un seul crumb (pas « deep ») — sans backHref le bouton
    // n'existerait pas ; avec backHref il apparaît et navigue vers le parent.
    renderHeader('/app/dons', 'Dons & Quêtes', '/app');

    const back = await screen.findByRole('button', { name: /retour/i });
    await userEvent.click(back);

    expect(mockPush).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith('/app');
  });

  test("pas de bouton retour sur une racine de section sans backHref", async () => {
    renderHeader('/app/dons', 'Dons & Quêtes');

    // Le titre est rendu (meta enregistré)…
    expect(
      (await screen.findAllByText('Dons & Quêtes')).length,
    ).toBeGreaterThan(0);
    // …mais aucune affordance retour : racine de section, déjà dans la nav.
    expect(
      screen.queryByRole('button', { name: /retour/i }),
    ).not.toBeInTheDocument();
  });
});
