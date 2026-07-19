import { screen } from '@testing-library/react';

import { paths } from '@/config/paths';
import { renderApp } from '@/testing/test-utils';

import { ModuleShortcuts } from '../module-shortcuts';

/**
 * Ce que ces tests protègent : l'accueil doit montrer ce qui distingue Jàngu Bi
 * d'une application de lectures. Si ces entrées disparaissent, l'avantage
 * produit redevient invisible (DIRECTION §1).
 */
describe('ModuleShortcuts', () => {
  test('met en avant les deux gestes qu’aucune app de lectures ne propose', () => {
    renderApp(<ModuleShortcuts />);

    expect(
      screen.getByRole('link', { name: /demander un document/i }),
    ).toHaveAttribute('href', paths.app.newDocument.getHref());
    expect(
      screen.getByRole('link', { name: /écrire à mon curé/i }),
    ).toHaveAttribute('href', paths.app.messages.getHref());
  });

  test('donne accès aux autres modules du produit', () => {
    renderApp(<ModuleShortcuts />);

    const attendus: ReadonlyArray<[RegExp, string]> = [
      [/intentions/i, paths.app.intentions.getHref()],
      [/agenda/i, paths.app.agenda.getHref()],
      [/chapelet/i, paths.app.chapelet.getHref()],
      [/bible/i, paths.app.bible.getHref()],
      [/les heures/i, paths.app.spirituelHeures.getHref()],
      [/dons/i, paths.app.dons.getHref()],
      [/jàngu bi tv/i, paths.app.tv.getHref()],
    ];

    for (const [nom, href] of attendus) {
      expect(screen.getByRole('link', { name: nom })).toHaveAttribute(
        'href',
        href,
      );
    }
  });

  test('toutes les routes viennent de `paths`, aucune n’est inventée', () => {
    renderApp(<ModuleShortcuts />);

    const routesConnues = new Set(
      Object.values(paths.app)
        .filter(
          (entry): entry is { getHref: () => string } =>
            typeof (entry as { getHref?: unknown }).getHref === 'function',
        )
        .map((entry) => entry.getHref()),
    );

    for (const lien of screen.getAllByRole('link')) {
      expect(routesConnues).toContain(lien.getAttribute('href'));
    }
  });
});
