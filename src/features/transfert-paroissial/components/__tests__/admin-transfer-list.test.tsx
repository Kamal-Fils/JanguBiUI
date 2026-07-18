import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { TransferRequest } from '../../types';
import { AdminTransferList } from '../admin-transfer-list';

function makeTransfer(
  overrides: Partial<TransferRequest> = {},
): TransferRequest {
  return {
    id: 1,
    status: 'pending',
    reason: 'Déménagement à Thiès',
    rejection_reason: null,
    origin_parish_name: 'Paroisse Saint-Pierre',
    destination_parish_name: 'Paroisse Sainte-Anne',
    created_at: '2026-06-01T08:00:00Z',
    updated_at: null,
    ...overrides,
  };
}

/**
 * Les actions par ligne vivent dans un menu « ⋯ » — on l'ouvre avant d'asserter.
 * La DataTable rend chaque ligne deux fois (table desktop + carte mobile,
 * départagées par CSS que jsdom n'applique pas) : on ouvre le premier menu.
 */
async function openRowActions(transferId: number) {
  const [trigger] = await screen.findAllByRole('button', {
    name: `Actions pour la demande #${transferId}`,
  });
  await userEvent.click(trigger);
}

describe('AdminTransferList', () => {
  test('affiche le trajet (origine → destination) et le statut', async () => {
    renderApp(<AdminTransferList transfers={[makeTransfer()]} />);

    expect(
      (await screen.findAllByText('Paroisse Saint-Pierre')).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Paroisse Sainte-Anne').length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('En attente').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Déménagement à Thiès/).length).toBeGreaterThan(
      0,
    );
  });

  test('le menu « ⋯ » d\'une demande en attente propose Approuver et Refuser', async () => {
    renderApp(<AdminTransferList transfers={[makeTransfer()]} />);

    await openRowActions(1);

    expect(
      await screen.findByRole('menuitem', { name: 'Approuver' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Refuser' }),
    ).toBeInTheDocument();
  });

  test('approuver : appel API puis notification de succès', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/transfers/1/approve/`, () =>
        HttpResponse.json({}),
      ),
    );

    renderApp(<AdminTransferList transfers={[makeTransfer()]} />);

    await openRowActions(1);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Approuver' }),
    );

    expect(
      await screen.findByText('La demande a été approuvée.'),
    ).toBeInTheDocument();
  });

  test('refuser : dialogue avec motif obligatoire puis notification', async () => {
    let received: unknown;
    server.use(
      http.post(
        `${env.API_URL}/v1/transfers/1/reject/`,
        async ({ request }) => {
          received = await request.json();
          return HttpResponse.json({});
        },
      ),
    );

    renderApp(<AdminTransferList transfers={[makeTransfer()]} />);

    await openRowActions(1);
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Refuser' }),
    );

    // Le dialogue s'ouvre — le bouton de confirmation est inactif sans motif.
    expect(
      await screen.findByText(
        'Le fidèle recevra une notification avec le motif du refus.',
      ),
    ).toBeInTheDocument();
    const confirmButton = screen.getByRole('button', {
      name: 'Confirmer le refus',
    });
    expect(confirmButton).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText(/motif du refus/i),
      'Dossier incomplet',
    );
    await userEvent.click(confirmButton);

    expect(
      await screen.findByText('La demande a été refusée.'),
    ).toBeInTheDocument();
    expect(received).toEqual({ reason: 'Dossier incomplet' });
  });

  test('demande approuvée par l\'origine : seule action « Accuser réception »', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/transfers/2/acknowledge/`, () =>
        HttpResponse.json({}),
      ),
    );

    renderApp(
      <AdminTransferList
        transfers={[makeTransfer({ id: 2, status: 'approved_by_origin' })]}
      />,
    );

    await openRowActions(2);

    expect(
      await screen.findByRole('menuitem', { name: 'Accuser réception' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Approuver' }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Accuser réception' }),
    );
    expect(
      await screen.findByText('La réception a été enregistrée.'),
    ).toBeInTheDocument();
  });

  test('statut terminal (completed / rejected) : aucune action proposée', async () => {
    renderApp(
      <AdminTransferList
        transfers={[
          makeTransfer({ id: 3, status: 'completed' }),
          makeTransfer({ id: 4, status: 'rejected' }),
        ]}
      />,
    );

    expect(
      (await screen.findAllByText('Transfert effectué')).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryAllByRole('button', { name: /Actions pour la demande/ }),
    ).toHaveLength(0);
  });

  test('liste vide → EmptyState incitatif', async () => {
    renderApp(<AdminTransferList transfers={[]} />);

    expect(
      await screen.findByText('Aucune demande de transfert'),
    ).toBeInTheDocument();
  });
});
