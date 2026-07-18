import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createDocumentRequest } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { VaultContent } from '../vault-content';

describe('VaultContent', () => {
  test('shows loading skeleton while fetching', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, async () => {
        await delay(Infinity);
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );

    renderApp(<VaultContent />);

    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  test('ne demande que les documents déposés (status=document_deposited)', async () => {
    let capturedStatus: string | null = null;
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, ({ request }) => {
        capturedStatus = new URL(request.url).searchParams.get('status');
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );

    renderApp(<VaultContent />);

    await screen.findByText(/votre coffre-fort est prêt/i);
    expect(capturedStatus).toBe('document_deposited');
  });

  test('coffre-fort vide : EmptyState incitatif avec action « Faire une demande »', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(<VaultContent />);

    await screen.findByText(/votre coffre-fort est prêt/i);
    expect(screen.getByText(/délivré par votre paroisse/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /faire une demande/i }),
    ).toHaveAttribute('href', '/app/documents/new');
  });

  test('coffre-fort rempli : cartes-certificats avec référence, destinataire et accès au détail', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createDocumentRequest({
              id: '42',
              reference: 'DOC-2026-0188',
              document_type: 'baptism',
              status: 'document_deposited',
              requester_name: 'Awa Sène',
              parish_name: 'Paroisse Saint-Pierre',
              updated_at: '2026-07-10T09:00:00Z',
            }),
          ],
        }),
      ),
    );

    renderApp(<VaultContent />);

    await screen.findByText('Certificat de baptême');
    expect(screen.getByText(/Réf\. DOC-2026-0188/)).toBeInTheDocument();
    expect(screen.getByText(/Délivré à/, { selector: 'p' })).toHaveTextContent(
      'Awa Sène',
    );
    expect(screen.getByText('Paroisse Saint-Pierre')).toBeInTheDocument();
    expect(screen.getByText(/déposé le 10 juillet 2026/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /voir la démarche/i }),
    ).toHaveAttribute('href', '/app/documents/42');
    // Ligne de réassurance : conservation à vie + confidentialité.
    expect(
      screen.getByText(/accessible uniquement par vous/i),
    ).toBeInTheDocument();
  });

  test('téléchargement en 1 clic : le fichier final est résolu via le détail', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createDocumentRequest({
              id: '42',
              document_type: 'confirmation',
              status: 'document_deposited',
            }),
          ],
        }),
      ),
      http.get(`${env.API_URL}/v1/documents/requests/:id/`, ({ params }) =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: String(params.id),
            document_type: 'confirmation',
            status: 'document_deposited',
          }),
          attachments: [
            {
              id: 1,
              attachment_type: 'supporting',
              file_url: 'https://files.test/piece-jointe.pdf',
              created_at: '2026-07-01T09:00:00Z',
            },
            {
              id: 2,
              attachment_type: 'final_document',
              file_url: 'https://files.test/attestation-finale.pdf',
              created_at: '2026-07-10T09:00:00Z',
            },
          ],
        }),
      ),
    );

    renderApp(<VaultContent />);

    const download = await screen.findByRole('link', { name: /télécharger/i });
    // Le document final prime sur les autres pièces jointes.
    expect(download).toHaveAttribute(
      'href',
      'https://files.test/attestation-finale.pdf',
    );
  });

  test('partage désactivé et annoncé « Bientôt » sur chaque certificat', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createDocumentRequest({
              id: '42',
              document_type: 'baptism',
              status: 'document_deposited',
            }),
          ],
        }),
      ),
    );

    renderApp(<VaultContent />);

    await screen.findByText('Certificat de baptême');
    const share = screen.getByRole('button', { name: /partager/i });
    expect(share).toBeDisabled();
    expect(share).toHaveAttribute('aria-disabled', 'true');
    expect(share).toHaveTextContent(/bientôt/i);
  });

  test('erreur : ErrorState avec retry qui recharge le coffre-fort', async () => {
    let calls = 0;
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { message: 'Erreur interne.' },
            { status: 500 },
          );
        }
        return HttpResponse.json({
          count: 1,
          results: [
            createDocumentRequest({
              id: '7',
              document_type: 'confirmation',
              status: 'document_deposited',
            }),
          ],
        });
      }),
    );

    renderApp(<VaultContent />);

    await screen.findByText(/impossible de charger vos documents/i);
    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    await screen.findByText('Attestation de confirmation');
  });
});
