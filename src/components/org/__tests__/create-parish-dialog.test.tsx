import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { CreateParishDialog } from '../create-parish-dialog';

const URL_DIOCESES = `${env.API_URL}/v1/org/dioceses/`;
const URL_PARISHES = `${env.API_URL}/v1/org/parishes/`;

const DIOCESES = [
  { id: 1, name: 'Archidiocèse de Dakar', code: 'ADK', province: 1 },
];

describe('CreateParishDialog', () => {
  beforeEach(() =>
    server.use(
      http.get(URL_DIOCESES, () => HttpResponse.json({ results: DIOCESES })),
    ),
  );

  test('crée une paroisse (payload vérifié) avec le diocèse du filtre présélectionné', async () => {
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.post(URL_PARISHES, async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: 42,
            name: 'Paroisse Sainte-Anne',
            city: 'Dakar',
            address: '',
            diocese: 1,
            diocese_name: 'Archidiocèse de Dakar',
          },
          { status: 201 },
        );
      }),
    );

    renderApp(<CreateParishDialog defaultDioceseId={1} />);

    await userEvent.click(
      screen.getByRole('button', { name: /nouvelle paroisse/i }),
    );
    await userEvent.type(
      await screen.findByLabelText('Nom'),
      'Paroisse Sainte-Anne',
    );
    await userEvent.type(screen.getByLabelText(/Ville/), 'Dakar');
    await userEvent.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText('Paroisse créée')).toBeInTheDocument();
    // Adresse vide non envoyée (champ optionnel) ; diocèse repris du filtre.
    expect(payload).toEqual({
      name: 'Paroisse Sainte-Anne',
      diocese_id: 1,
      city: 'Dakar',
    });
  });
});
