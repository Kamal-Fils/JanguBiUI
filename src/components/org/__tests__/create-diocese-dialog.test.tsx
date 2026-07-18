import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { CreateDioceseDialog } from '../create-diocese-dialog';

// Radix Select a besoin de ces stubs sous jsdom.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.releasePointerCapture = vi.fn();
});

const URL_PROVINCES = `${env.API_URL}/v1/org/provinces/`;
const URL_DIOCESES = `${env.API_URL}/v1/org/dioceses/`;

const PROVINCES = [
  { id: 1, name: 'Province de Dakar', code: 'DKR', country: 'Sénégal' },
  { id: 2, name: 'Province de Kaolack', code: 'KLK', country: 'Sénégal' },
];

describe('CreateDioceseDialog', () => {
  beforeEach(() =>
    server.use(
      http.get(URL_PROVINCES, () =>
        HttpResponse.json({ results: PROVINCES }),
      ),
    ),
  );

  test('crée un diocèse (payload vérifié) avec la province choisie au sélecteur', async () => {
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.post(URL_DIOCESES, async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { id: 9, name: 'Diocèse de Fatick', code: 'FTK', province: 2 },
          { status: 201 },
        );
      }),
    );

    renderApp(<CreateDioceseDialog />);

    await userEvent.click(
      screen.getByRole('button', { name: /nouveau diocèse/i }),
    );
    await userEvent.type(
      await screen.findByLabelText('Nom'),
      'Diocèse de Fatick',
    );
    await userEvent.type(screen.getByLabelText('Code'), 'FTK');
    await userEvent.click(screen.getByLabelText('Province'));
    await userEvent.click(
      await screen.findByRole('option', { name: /Kaolack/ }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText('Diocèse créé')).toBeInTheDocument();
    expect(payload).toEqual({
      name: 'Diocèse de Fatick',
      code: 'FTK',
      province_id: 2,
    });
  });

  test('présélectionne la province du filtre actif (defaultProvinceId)', async () => {
    let payload: Record<string, unknown> | null = null;
    server.use(
      http.post(URL_DIOCESES, async ({ request }) => {
        payload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          { id: 10, name: 'Diocèse de Rufisque', code: 'RFQ', province: 1 },
          { status: 201 },
        );
      }),
    );

    renderApp(<CreateDioceseDialog defaultProvinceId={1} />);

    await userEvent.click(
      screen.getByRole('button', { name: /nouveau diocèse/i }),
    );
    await userEvent.type(
      await screen.findByLabelText('Nom'),
      'Diocèse de Rufisque',
    );
    await userEvent.type(screen.getByLabelText('Code'), 'RFQ');
    // Pas d'interaction avec le sélecteur : la province du filtre est reprise.
    await userEvent.click(screen.getByRole('button', { name: 'Créer' }));

    expect(await screen.findByText('Diocèse créé')).toBeInTheDocument();
    expect(payload).toEqual({
      name: 'Diocèse de Rufisque',
      code: 'RFQ',
      province_id: 1,
    });
  });
});
