import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { useProvinces } from '@/lib/org/get-provinces';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { CreateProvinceDialog } from '../create-province-dialog';

const URL_PROVINCES = `${env.API_URL}/v1/org/provinces/`;

/** Harness : le dialogue + une liste branchée sur useProvinces pour prouver l'invalidation. */
function Harness() {
  const { data: provinces = [] } = useProvinces();
  return (
    <div>
      <CreateProvinceDialog />
      <ul aria-label="Provinces">
        {provinces.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </div>
  );
}

describe('CreateProvinceDialog', () => {
  test('crée une province (payload vérifié) puis rafraîchit la liste via invalidation', async () => {
    let created = false;
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.get(URL_PROVINCES, () =>
        HttpResponse.json({
          results: created
            ? [
                {
                  id: 3,
                  name: 'Province de Kaolack',
                  code: 'KLK',
                  country: 'Sénégal',
                },
              ]
            : [],
        }),
      ),
      http.post(URL_PROVINCES, async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        created = true;
        return HttpResponse.json(
          {
            id: 3,
            name: 'Province de Kaolack',
            code: 'KLK',
            country: 'Sénégal',
          },
          { status: 201 },
        );
      }),
    );

    renderApp(<Harness />);

    await userEvent.click(
      screen.getByRole('button', { name: /nouvelle province/i }),
    );
    await userEvent.type(
      await screen.findByLabelText('Nom'),
      'Province de Kaolack',
    );
    await userEvent.type(screen.getByLabelText('Code'), 'KLK');
    await userEvent.type(screen.getByLabelText(/Pays/), 'Sénégal');
    await userEvent.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText('Province créée')).toBeInTheDocument();
    expect(payload).toEqual({
      name: 'Province de Kaolack',
      code: 'KLK',
      country: 'Sénégal',
    });
    // Invalidation ['org', 'provinces'] → la liste est rechargée et affiche la
    // nouvelle province.
    expect(
      await screen.findByText('Province de Kaolack'),
    ).toBeInTheDocument();
  });

  test("n'envoie pas `country` quand le champ optionnel est vide", async () => {
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.get(URL_PROVINCES, () => HttpResponse.json({ results: [] })),
      http.post(URL_PROVINCES, async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { id: 4, name: 'Province de Ziguinchor', code: 'ZIG', country: '' },
          { status: 201 },
        );
      }),
    );

    renderApp(<Harness />);

    await userEvent.click(
      screen.getByRole('button', { name: /nouvelle province/i }),
    );
    await userEvent.type(
      await screen.findByLabelText('Nom'),
      'Province de Ziguinchor',
    );
    await userEvent.type(screen.getByLabelText('Code'), 'ZIG');
    await userEvent.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText('Province créée')).toBeInTheDocument();
    expect(payload).toEqual({ name: 'Province de Ziguinchor', code: 'ZIG' });
  });
});
