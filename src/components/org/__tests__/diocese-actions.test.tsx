import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { useDioceses } from '@/lib/org/get-dioceses';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import type { Diocese } from '@/types/org';

import { DioceseActions } from '../diocese-actions';

const URL_DIOCESES = `${env.API_URL}/v1/org/dioceses/`;

const diocese: Diocese = {
  id: 4,
  name: 'Diocèse de Thiès',
  code: 'THS',
  province: 1,
  province_name: 'Province de Dakar',
};

describe('DioceseActions', () => {
  test('édite un diocèse (PATCH) et notifie le succès', async () => {
    let patched: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${URL_DIOCESES}4/`, async ({ request }) => {
        patched = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...diocese, ...patched });
      }),
    );

    renderApp(<DioceseActions diocese={diocese} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Modifier Diocèse de Thiès/i }),
    );
    const nameInput = await screen.findByLabelText('Nom');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Diocèse de Mbour');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Diocèse modifié')).toBeInTheDocument();
    expect(patched).toEqual({ name: 'Diocèse de Mbour', code: 'THS' });
  });

  test('suppression refusée (400) → le message métier du backend est affiché', async () => {
    const detail =
      'Impossible de supprimer : des paroisses y sont rattachées.';
    server.use(
      http.delete(`${URL_DIOCESES}4/`, () =>
        HttpResponse.json({ detail }, { status: 400 }),
      ),
    );

    renderApp(<DioceseActions diocese={diocese} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Supprimer Diocèse de Thiès/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    // La notification d'erreur reprend le `detail` renvoyé par le backend.
    expect(await screen.findByText(detail)).toBeInTheDocument();
  });

  test('supprime un diocèse (204) puis rafraîchit la liste via invalidation', async () => {
    let deleted = false;
    server.use(
      http.get(URL_DIOCESES, () =>
        HttpResponse.json({
          results: deleted
            ? [{ id: 5, name: 'Diocèse de Kaolack', code: 'KLK', province: 2 }]
            : [
                diocese,
                { id: 5, name: 'Diocèse de Kaolack', code: 'KLK', province: 2 },
              ],
        }),
      ),
      http.delete(`${URL_DIOCESES}4/`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    /** Liste branchée sur useDioceses pour prouver l'invalidation → refetch. */
    function Harness() {
      const { data: dioceses = [] } = useDioceses();
      return (
        <ul aria-label="Diocèses">
          {dioceses.map((d) => (
            <li key={d.id}>
              <span>{d.name}</span>
              <DioceseActions diocese={d} />
            </li>
          ))}
        </ul>
      );
    }

    renderApp(<Harness />);

    await userEvent.click(
      await screen.findByRole('button', { name: /Supprimer Diocèse de Thiès/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(await screen.findByText('Diocèse supprimé')).toBeInTheDocument();
    expect(deleted).toBe(true);
    // Invalidation ['org', 'dioceses'] → la liste rechargée ne contient plus
    // le diocèse supprimé.
    await waitFor(() =>
      expect(screen.queryByText('Diocèse de Thiès')).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Diocèse de Kaolack')).toBeInTheDocument();
  });
});
