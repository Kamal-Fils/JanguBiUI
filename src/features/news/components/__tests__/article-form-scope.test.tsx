import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, userEvent, waitFor } from '@/testing/test-utils';

import { ArticleForm } from '../article-form';

/**
 * Portée « église » — elle existait de bout en bout côté serveur (modèle,
 * index, sérialiseurs d'entrée ET de sortie) mais le formulaire ne la proposait
 * pas : une paroisse à plusieurs églises ne pouvait adresser une annonce à une
 * seule d'entre elles. Le type de charge utile écrit à la main bornait par
 * ailleurs `scope_type` à trois valeurs et omettait `scope_church_id`, sans
 * qu'aucune vérification ne compare les deux définitions.
 *
 * La paroisse est amenée par `defaultValues` plutôt qu'en pilotant
 * `ParishSelector` : c'est une cascade Radix (province → diocèse → paroisse),
 * dont le parcours détaillé relève de ses propres tests. Ce qui est vérifié
 * ici, c'est le comportement du choix d'église.
 */

/** Forme exacte attendue par `churchSchema` (src/lib/org/get-churches.ts) :
 *  omettre `is_main` ou `parish` fait échouer le parse zod, et la liste arrive
 *  vide sans que rien ne le signale. */
const CHURCHES_BY_PARISH = {
  1: [
    { id: 11, name: 'Église principale Saint-Joseph', is_main: true, parish: 1 },
    { id: 12, name: 'Chapelle Saint-Pierre', is_main: false, parish: 1 },
  ],
  2: [{ id: 21, name: 'Église Sainte-Anne', is_main: true, parish: 2 }],
} as const;

function mockOrg() {
  server.use(
    http.get(`${env.API_URL}/v1/org/parishes/`, () =>
      HttpResponse.json({
        count: 1,
        results: [{ id: 1, name: 'Saint-Joseph', diocese_id: 1, city: 'Dakar' }],
      }),
    ),
    http.get(`${env.API_URL}/v1/org/dioceses/`, () =>
      HttpResponse.json({
        count: 1,
        results: [{ id: 1, name: 'Diocèse de Dakar' }],
      }),
    ),
    http.get(`${env.API_URL}/v1/org/churches/`, ({ request }) => {
      const parishId = Number(new URL(request.url).searchParams.get('parish'));
      const results =
        CHURCHES_BY_PARISH[parishId as keyof typeof CHURCHES_BY_PARISH] ?? [];
      return HttpResponse.json({ count: results.length, results });
    }),
    http.get(`${env.API_URL}/v1/news/categories/`, () =>
      HttpResponse.json({
        count: 1,
        results: [{ id: 1, name: 'Vie paroissiale', slug: 'vie' }],
      }),
    ),
  );
}

describe('ArticleForm — portée église', () => {
  beforeEach(() => mockOrg());

  it('propose la portée « Église » parmi les portées disponibles', async () => {
    // Arrange & Act
    renderApp(<ArticleForm onSubmit={vi.fn()} />);

    // Assert
    const scope = await screen.findByLabelText(/portée/i);
    expect(
      Array.from(scope.querySelectorAll('option')).map((o) => o.value),
    ).toEqual(['global', 'diocese', 'parish', 'church']);
  });

  it('n’affiche le choix d’église qu’une fois la portée « église » retenue', async () => {
    renderApp(<ArticleForm onSubmit={vi.fn()} />);

    const scope = await screen.findByLabelText(/portée/i);
    expect(screen.queryByLabelText(/^église/i)).not.toBeInTheDocument();

    await userEvent.selectOptions(scope, 'church');

    expect(await screen.findByLabelText(/^église/i)).toBeInTheDocument();
  });

  it('laisse le choix d’église inactif tant qu’aucune paroisse n’est retenue', async () => {
    // Une liste plate de toutes les églises du pays serait inexploitable :
    // l'église se désigne à travers sa paroisse.
    renderApp(<ArticleForm onSubmit={vi.fn()} />);

    await userEvent.selectOptions(
      await screen.findByLabelText(/portée/i),
      'church',
    );

    expect(await screen.findByLabelText(/^église/i)).toBeDisabled();
  });

  it('liste les églises de la paroisse retenue, et elles seules', async () => {
    renderApp(
      <ArticleForm
        onSubmit={vi.fn()}
        defaultValues={{ scope_type: 'church', scope_parish_id: 1 }}
      />,
    );

    expect(
      await screen.findByRole('option', { name: 'Chapelle Saint-Pierre' }),
    ).toBeInTheDocument();
    // L'église d'une AUTRE paroisse ne doit pas apparaître.
    expect(
      screen.queryByRole('option', { name: 'Église Sainte-Anne' }),
    ).not.toBeInTheDocument();
  });

  it('transmet l’église retenue dans la charge utile', async () => {
    const onSubmit = vi.fn();
    renderApp(
      <ArticleForm
        onSubmit={onSubmit}
        defaultValues={{
          scope_type: 'church',
          scope_parish_id: 1,
          category_id: 1,
          content: '<p>Corps de l’annonce</p>',
        }}
      />,
    );

    await userEvent.type(
      await screen.findByRole('textbox', { name: /^titre/i }),
      'Messe de rentrée',
    );
    await userEvent.selectOptions(
      await screen.findByRole('combobox', { name: /^église/i }),
      '12',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /enregistrer|publier/i }),
    );

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      scope_type: 'church',
      scope_church_id: 12,
    });
  });

  it('signale une paroisse sans église plutôt que d’afficher une liste vide', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/org/churches/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(
      <ArticleForm
        onSubmit={vi.fn()}
        defaultValues={{ scope_type: 'church', scope_parish_id: 1 }}
      />,
    );

    expect(
      await screen.findByText(/aucune église enregistrée/i),
    ).toBeInTheDocument();
  });
});
