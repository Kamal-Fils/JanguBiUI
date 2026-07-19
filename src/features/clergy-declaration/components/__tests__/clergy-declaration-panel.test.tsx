import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { ClergyDeclaration } from '../../api/get-my-clergy-declaration';
import { ClergyDeclarationPanel } from '../clergy-declaration-panel';

const DECLARATION_URL = `${env.API_URL}/v1/users/me/clergy-declaration/`;

const declaration = (
  overrides?: Partial<ClergyDeclaration>,
): ClergyDeclaration => ({
  id: 1,
  claimed_pastoral_role: 'pretre',
  status: 'pending',
  parish_id: 7,
  parish_name: 'Paroisse Saint-Joseph',
  message: '',
  rejection_reason: '',
  justification_file_url: null,
  submitted_at: '2026-07-01T10:00:00Z',
  reviewed_at: null,
  ...overrides,
});

const respondWith = (body: ClergyDeclaration | null) =>
  server.use(http.get(DECLARATION_URL, () => HttpResponse.json(body)));

describe('ClergyDeclarationPanel — aiguillage du parcours', () => {
  test('sans demande antérieure, l’écran propose de déclarer', async () => {
    respondWith(null);

    renderApp(<ClergyDeclarationPanel />);

    expect(
      await screen.findByRole('heading', { name: /déclarer mon ministère/i }),
    ).toBeInTheDocument();
  });

  test('une demande en attente affiche le suivi, pas le formulaire', async () => {
    respondWith(declaration());

    renderApp(<ClergyDeclarationPanel />);

    expect(
      await screen.findByText(/en attente de validation/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /déclarer mon ministère/i }),
    ).not.toBeInTheDocument();
  });

  test('une demande refusée affiche le motif ET rouvre le dépôt', async () => {
    // Un refus doit rester corrigeable : le serveur autorise une nouvelle
    // demande après rejet, l'écran doit donc la rendre atteignable.
    respondWith(
      declaration({
        status: 'rejected',
        rejection_reason: 'Justificatif illisible.',
        reviewed_at: '2026-07-05T09:00:00Z',
      }),
    );

    renderApp(<ClergyDeclarationPanel />);

    expect(await screen.findByText('Justificatif illisible.')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /déclarer mon ministère/i }),
    ).toBeInTheDocument();
  });

  test('une demande approuvée ne propose pas de redéclarer', async () => {
    respondWith(declaration({ status: 'approved', reviewed_at: '2026-07-05T09:00:00Z' }));

    renderApp(<ClergyDeclarationPanel />);

    expect(await screen.findByText(/validée/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /déclarer mon ministère/i }),
    ).not.toBeInTheDocument();
  });

  test('une erreur de chargement propose de réessayer', async () => {
    server.use(
      http.get(DECLARATION_URL, () => new HttpResponse(null, { status: 500 })),
    );

    renderApp(<ClergyDeclarationPanel />);

    await waitFor(() =>
      expect(
        screen.getByText(/impossible de charger votre demande/i),
      ).toBeInTheDocument(),
    );
  });
});
