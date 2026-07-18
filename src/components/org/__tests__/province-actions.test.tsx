import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import type { Province } from '@/types/org';

import { ProvinceActions } from '../province-actions';

const URL_PROVINCES = `${env.API_URL}/v1/org/provinces/`;

const province: Province = {
  id: 2,
  name: 'Province de Dakar',
  code: 'DKR',
  country: 'Sénégal',
};

describe('ProvinceActions', () => {
  test('édite une province (PATCH) et notifie le succès', async () => {
    let patched: Record<string, unknown> | null = null;
    server.use(
      http.patch(`${URL_PROVINCES}2/`, async ({ request }) => {
        patched = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ ...province, ...patched });
      }),
    );

    renderApp(<ProvinceActions province={province} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Modifier Province de Dakar/i }),
    );
    const codeInput = await screen.findByLabelText('Code');
    await userEvent.clear(codeInput);
    await userEvent.type(codeInput, 'PDK');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Province modifiée')).toBeInTheDocument();
    expect(patched).toEqual({ name: 'Province de Dakar', code: 'PDK' });
  });

  test('suppression refusée (400) → le message métier du backend est affiché', async () => {
    const detail = 'Impossible de supprimer : des diocèses y sont rattachés.';
    server.use(
      http.delete(`${URL_PROVINCES}2/`, () =>
        HttpResponse.json({ detail }, { status: 400 }),
      ),
    );

    renderApp(<ProvinceActions province={province} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Supprimer Province de Dakar/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    // La notification d'erreur reprend le `detail` renvoyé par le backend.
    expect(await screen.findByText(detail)).toBeInTheDocument();
  });

  test('supprime une province (DELETE 204) après confirmation', async () => {
    let deleted = false;
    server.use(
      http.delete(`${URL_PROVINCES}2/`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderApp(<ProvinceActions province={province} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Supprimer Province de Dakar/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(await screen.findByText('Province supprimée')).toBeInTheDocument();
    expect(deleted).toBe(true);
  });
});
