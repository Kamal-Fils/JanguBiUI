import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { TransferRequestForm } from '../transfer-request-form';

// Radix Select a besoin de ces stubs sous jsdom.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
});

const PROVINCES = [
  { id: 1, name: 'Province de Dakar', code: 'DK', country: 'SN' },
];
const DIOCESES = [{ id: 10, name: 'Diocèse de Thiès', code: 'TH', province: 1 }];
const PARISHES = [
  { id: 100, name: 'Paroisse Sainte-Anne', city: 'Thiès', address: '', diocese: 10 },
];

const orgHandlers = [
  http.get(`${env.API_URL}/v1/org/provinces/`, () =>
    HttpResponse.json({ results: PROVINCES }),
  ),
  http.get(`${env.API_URL}/v1/org/dioceses/`, () =>
    HttpResponse.json({ results: DIOCESES }),
  ),
  http.get(`${env.API_URL}/v1/org/parishes/`, () =>
    HttpResponse.json({ count: PARISHES.length, results: PARISHES }),
  ),
];

async function pickOption(comboboxLabel: string, optionName: RegExp) {
  await userEvent.click(screen.getByLabelText(comboboxLabel));
  await userEvent.click(
    await screen.findByRole('option', { name: optionName }),
  );
}

describe('TransferRequestForm', () => {
  beforeEach(() => server.use(...orgHandlers));

  test('soumet la demande avec la paroisse choisie et le motif', async () => {
    let received: unknown;
    server.use(
      http.post(`${env.API_URL}/v1/transfers/`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(
          {
            id: 1,
            status: 'pending',
            reason: 'Déménagement',
            rejection_reason: null,
            origin_parish_name: 'Paroisse Saint-Pierre',
            destination_parish_name: 'Paroisse Sainte-Anne',
            created_at: '2026-06-01T08:00:00Z',
            updated_at: null,
          },
          { status: 201 },
        );
      }),
    );
    const onSuccess = vi.fn();

    renderApp(<TransferRequestForm onSuccess={onSuccess} />);

    // Cascade Province → Diocèse → Paroisse.
    await pickOption('Province', /Province de Dakar/);
    await pickOption('Diocèse', /Diocèse de Thiès/);
    await pickOption('Paroisse', /Paroisse Sainte-Anne/);

    await userEvent.type(
      screen.getByLabelText(/motif du transfert/i),
      'Déménagement',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /soumettre la demande/i }),
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(received).toEqual({
      destination_parish_id: 100,
      reason: 'Déménagement',
    });
  });

  test('sans paroisse sélectionnée : erreur de validation, pas d\'appel API', async () => {
    const onSuccess = vi.fn();

    renderApp(<TransferRequestForm onSuccess={onSuccess} />);

    await userEvent.click(
      screen.getByRole('button', { name: /soumettre la demande/i }),
    );

    expect(
      await screen.findByText(
        'Veuillez sélectionner une paroisse de destination',
      ),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
