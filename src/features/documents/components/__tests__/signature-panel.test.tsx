import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { createDocumentRequest } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { SignaturePanel } from '../signature-panel';

const validated = createDocumentRequest({
  id: 'sign-1',
  status: 'validated',
  document_type: 'baptism',
  requester_name: 'Pierre Mendy',
  reference: 'DOC-2026-0301',
});

describe('SignaturePanel — mise en scène de la signature (niveau 2)', () => {
  test('présente la demande prête à signer, sa référence et la vérification niveau 1', () => {
    renderApp(<SignaturePanel documents={[validated]} />);

    expect(
      screen.getByRole('heading', { name: /signature du curé/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/certificat de baptême — pierre mendy/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/DOC-2026-0301/)).toBeInTheDocument();
    expect(
      screen.getByText(/concordance au registre vérifiée \(niveau 1\)/i),
    ).toBeInTheDocument();
  });

  test('propose l’acte « Signer et déposer »', () => {
    renderApp(<SignaturePanel documents={[validated]} />);

    expect(
      screen.getByRole('button', { name: /signer et déposer/i }),
    ).toBeInTheDocument();
  });

  test('signer déclenche le dépôt côté backend (transition inchangée)', async () => {
    let calledId = '';
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/admin/requests/:id/deposit/`,
        ({ params }) => {
          calledId = String(params.id);
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    renderApp(<SignaturePanel documents={[validated]} />);

    await userEvent.click(
      screen.getByRole('button', { name: /signer et déposer/i }),
    );

    await waitFor(() => expect(calledId).toBe('sign-1'));
  });

  test('le panneau est piloté par le STATUT : rien à signer, rien à afficher', () => {
    // Le front ne distingue pas niv.1 / niv.2 (§6.5) : c'est l'état
    // « validée » qui déclenche la mise en scène, pas un rôle inexistant.
    renderApp(
      <SignaturePanel
        documents={[
          createDocumentRequest({ id: 'a', status: 'submitted' }),
          createDocumentRequest({ id: 'b', status: 'under_verification' }),
        ]}
      />,
    );

    expect(
      screen.queryByRole('heading', { name: /signature du curé/i }),
    ).not.toBeInTheDocument();
  });

  test('accorde le décompte quand plusieurs demandes attendent la signature', () => {
    renderApp(
      <SignaturePanel
        documents={[
          validated,
          createDocumentRequest({ id: 'sign-2', status: 'validated' }),
        ]}
      />,
    );

    expect(
      screen.getByText(/2 demandes ont passé la vérification/i),
    ).toBeInTheDocument();
  });
});
