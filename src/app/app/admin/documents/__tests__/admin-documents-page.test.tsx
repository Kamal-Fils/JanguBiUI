import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createAdminUser, createDocumentRequest } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import AdminDocumentsPage from '../page';

const LIST_URL = `${env.API_URL}/v1/documents/admin/requests/`;
const COUNTS_URL = `${env.API_URL}/v1/documents/admin/requests/counts/`;

/** Agent paroissial : `canProcessDocuments` garde la page. */
function asParishAdmin() {
  server.use(
    http.get(`${env.API_URL}/v1/auth/me/`, () =>
      HttpResponse.json(createAdminUser({ role: 'parish_admin' })),
    ),
  );
}

function mockCounts() {
  server.use(
    http.get(COUNTS_URL, () =>
      HttpResponse.json({
        counts: {
          submitted: 30,
          under_verification: 5,
          validated: 0,
          info_requested: 2,
          rejected: 1,
          document_deposited: 4,
        },
        total: 42,
      }),
    ),
  );
}

/** Renvoie une page de demandes et enregistre les paramètres reçus. */
function mockPagedList(captured: { limit?: string; offset?: string }[]) {
  server.use(
    http.get(LIST_URL, ({ request }) => {
      const url = new URL(request.url);
      // La requête du panneau signature (status=validated) n'est pas paginée.
      if (url.searchParams.get('status') === 'validated') {
        return HttpResponse.json({ count: 0, results: [] });
      }
      captured.push({
        limit: url.searchParams.get('limit') ?? undefined,
        offset: url.searchParams.get('offset') ?? undefined,
      });
      const offset = Number(url.searchParams.get('offset') ?? '0');
      return HttpResponse.json({
        count: 42,
        results: [
          createDocumentRequest({
            id: `doc-${offset}`,
            document_type: `Demande offset ${offset}`,
            status: 'submitted',
          }),
        ],
      });
    }),
  );
}

describe('AdminDocumentsPage', () => {
  test('affiche les comptages calculés par le serveur', async () => {
    asParishAdmin();
    mockCounts();
    mockPagedList([]);

    renderApp(<AdminDocumentsPage />);

    expect(
      await screen.findByRole('button', { name: /30\s*à traiter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/42 demandes sur votre périmètre/i),
    ).toBeInTheDocument();
  });

  test('demande la page suivante avec le bon décalage', async () => {
    asParishAdmin();
    mockCounts();
    const captured: { limit?: string; offset?: string }[] = [];
    mockPagedList(captured);

    renderApp(<AdminDocumentsPage />);

    const nav = await screen.findByRole('navigation', {
      name: /pagination de la file/i,
    });
    expect(nav).toHaveTextContent('Page 1 sur 3');
    expect(captured[0]).toMatchObject({ limit: '20', offset: '0' });

    await userEvent.click(within(nav).getByRole('button', { name: /suivant/i }));

    // La DataTable rend chaque ligne deux fois (tableau desktop + carte mobile).
    await screen.findAllByText('Demande offset 20');
    // Le bloc de pagination est re-rendu : on le ré-interroge plutôt que de
    // garder une référence devenue obsolète.
    expect(
      screen.getByRole('navigation', { name: /pagination de la file/i }),
    ).toHaveTextContent('Page 2 sur 3');
    expect(captured.at(-1)).toMatchObject({ limit: '20', offset: '20' });
  });

  test('la pagination reste masquée quand tout tient sur une page', async () => {
    asParishAdmin();
    mockCounts();
    server.use(
      http.get(LIST_URL, () =>
        HttpResponse.json({
          count: 2,
          results: [
            createDocumentRequest({ id: '1', status: 'submitted' }),
            createDocumentRequest({ id: '2', status: 'submitted' }),
          ],
        }),
      ),
    );

    renderApp(<AdminDocumentsPage />);

    await screen.findByText(/par ordre d’urgence/i);
    expect(
      screen.queryByRole('navigation', { name: /pagination de la file/i }),
    ).not.toBeInTheDocument();
  });
});
