import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';
import type { Parish } from '@/types/org';

import { ParishActions } from '../parish-actions';

const parish: Parish = {
  id: 7,
  name: 'Paroisse Saint-Joseph',
  city: 'Dakar',
  address: '',
  diocese: 1,
  diocese_name: 'Archidiocèse de Dakar',
};

describe('ParishActions', () => {
  test('édite une paroisse (PATCH) et notifie le succès', async () => {
    let patched: { name?: string } | null = null;
    server.use(
      http.patch(`${env.API_URL}/v1/org/parishes/7/`, async ({ request }) => {
        patched = (await request.json()) as { name?: string };
        return HttpResponse.json({ ...parish, name: patched?.name });
      }),
    );

    renderApp(<ParishActions parish={parish} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Modifier Paroisse Saint-Joseph/i }),
    );
    const nameInput = await screen.findByLabelText('Nom');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Paroisse Sainte-Anne');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Paroisse modifiée')).toBeInTheDocument();
    expect(patched).toEqual(
      expect.objectContaining({ name: 'Paroisse Sainte-Anne' }),
    );
  });

  test('supprime une paroisse (DELETE) après confirmation', async () => {
    let deleted = false;
    server.use(
      http.delete(`${env.API_URL}/v1/org/parishes/7/`, () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderApp(<ParishActions parish={parish} />);

    await userEvent.click(
      screen.getByRole('button', { name: /Supprimer Paroisse Saint-Joseph/i }),
    );
    // Bouton de confirmation dans la boîte de dialogue.
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(await screen.findByText('Paroisse supprimée')).toBeInTheDocument();
    expect(deleted).toBe(true);
  });
});
