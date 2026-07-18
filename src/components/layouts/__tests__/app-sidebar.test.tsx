import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';

import { renderApp } from '@/testing/test-utils';

import { AppSidebar, SIDEBAR_COLLAPSED_KEY } from '../app-sidebar';

// L'utilisateur par défaut de MSW (/v1/auth/me/) est un fidèle laïc — le
// périmètre RBAC fin des sections est couvert par nav-config.test.ts.

function renderSidebar(pathname: string) {
  vi.mocked(usePathname).mockReturnValue(pathname);
  return renderApp(<AppSidebar />);
}

describe('AppSidebar (refonte V4-1 — layout classique)', () => {
  beforeEach(() => {
    localStorage.removeItem(SIDEBAR_COLLAPSED_KEY);
  });

  test('rend les sections d’un fidèle (ni Espace clergé ni Administration)', async () => {
    renderSidebar('/app');

    expect(
      await screen.findByRole('navigation', { name: 'Navigation principale' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Documents' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Spiritualité' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Espace clergé')).not.toBeInTheDocument();
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
    // Accueil est la page courante.
    expect(screen.getByRole('link', { name: 'Accueil' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('la section active est auto-dépliée d’après le pathname (aria-current sur l’item)', async () => {
    renderSidebar('/app/bible');

    const bible = await screen.findByRole('link', { name: 'Bible' });
    expect(bible).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('button', { name: 'Spiritualité' }),
    ).toHaveAttribute('aria-expanded', 'true');
    // Une section inactive reste repliée.
    expect(
      screen.queryByRole('link', { name: 'Lettres pastorales' }),
    ).not.toBeInTheDocument();
  });

  test('une section se déplie/replie au clic (aria-expanded)', async () => {
    renderSidebar('/app');

    const actus = await screen.findByRole('button', { name: 'Actualité' });
    expect(actus).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(actus);
    expect(actus).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('link', { name: 'Lettres pastorales' }),
    ).toBeInTheDocument();

    await userEvent.click(actus);
    expect(actus).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('link', { name: 'Lettres pastorales' }),
    ).not.toBeInTheDocument();
  });

  test('le repli persiste dans localStorage et masque les sous-navs', async () => {
    renderSidebar('/app/bible');
    await screen.findByRole('link', { name: 'Bible' });

    await userEvent.click(
      screen.getByRole('button', { name: 'Replier la navigation' }),
    );

    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe('true');
    // Mode icônes : plus de sous-navs, le bouton devient « Déplier ».
    expect(
      screen.queryByRole('link', { name: 'Bible' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Déplier la navigation' }),
    ).toBeInTheDocument();
  });

  test('l’état replié est restauré depuis localStorage au montage', async () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
    renderSidebar('/app');

    expect(
      await screen.findByRole('button', { name: 'Déplier la navigation' }),
    ).toBeInTheDocument();
  });

  test('cliquer une section repliée redéplie la sidebar et ouvre la section', async () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, 'true');
    renderSidebar('/app');

    // En mode replié, la section est identifiée par son aria-label.
    const spiritualite = await screen.findByRole('button', {
      name: 'Spiritualité',
    });
    await userEvent.click(spiritualite);

    expect(localStorage.getItem(SIDEBAR_COLLAPSED_KEY)).toBe('false');
    expect(await screen.findByRole('link', { name: 'Bible' })).toBeInTheDocument();
  });
});
