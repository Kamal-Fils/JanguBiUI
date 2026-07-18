import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createDocumentRequest } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { DocumentDetail } from '../document-detail';

describe('DocumentDetail', () => {
  test('shows loading skeleton while fetching', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/1/`, async () => {
        await delay(Infinity);
        return HttpResponse.json({
          ...createDocumentRequest({
            id: '1',
            status: 'submitted',
            document_type: 'Baptême',
          }),
          status_logs: [],
        });
      }),
    );

    renderApp(<DocumentDetail documentId="1" />);

    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  test('shows document type and status after loading', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/1/`, () =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: '1',
            status: 'submitted',
            document_type: 'Baptême',
          }),
          status_logs: [],
        }),
      ),
    );

    renderApp(<DocumentDetail documentId="1" />);

    await screen.findByText('Baptême');
    // « Soumis » apparaît dans le badge ET comme étape courante de la timeline.
    expect(screen.getAllByText('Soumis').length).toBeGreaterThan(0);
  });

  test('affiche le suivi complet : historique franchi + étapes à venir', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/5/`, () =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: '5',
            status: 'under_verification',
            document_type: 'baptism',
          }),
          status_logs: [
            {
              to_status: 'submitted',
              created_at: '2026-07-01T10:00:00Z',
              comment: null,
            },
            {
              to_status: 'under_verification',
              created_at: '2026-07-02T09:00:00Z',
              comment: 'Prise en charge par la paroisse.',
            },
          ],
        }),
      ),
    );

    renderApp(<DocumentDetail documentId="5" />);

    await screen.findByRole('heading', { name: 'Suivi de la demande' });

    const timeline = screen.getByRole('list', {
      name: 'Suivi de la demande',
    });
    // Étape franchie + étape courante (l'historique du back).
    expect(within(timeline).getByText('Soumis')).toBeInTheDocument();
    expect(within(timeline).getByText('En vérification')).toBeInTheDocument();
    expect(
      within(timeline).getByText('Prise en charge par la paroisse.'),
    ).toBeInTheDocument();
    // Étapes restantes du chemin nominal, affichées « à venir ».
    expect(within(timeline).getByText('Validé')).toBeInTheDocument();
    expect(within(timeline).getByText('Déposé')).toBeInTheDocument();
    // L'étape courante est marquée aria-current="step".
    const current = timeline.querySelector('[aria-current="step"]');
    expect(current).not.toBeNull();
    expect(current).toHaveTextContent('En vérification');
  });

  test('branche info_requested : la vérification reprend après le complément', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/6/`, () =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: '6',
            status: 'info_requested',
            document_type: 'confirmation',
          }),
          status_logs: [
            {
              to_status: 'submitted',
              created_at: '2026-07-01T10:00:00Z',
              comment: null,
            },
            {
              to_status: 'info_requested',
              created_at: '2026-07-03T11:00:00Z',
              comment: 'Merci de préciser la date exacte.',
            },
          ],
        }),
      ),
    );

    renderApp(<DocumentDetail documentId="6" />);

    const timeline = await screen.findByRole('list', {
      name: 'Suivi de la demande',
    });
    expect(within(timeline).getByText('Infos requises')).toBeInTheDocument();
    expect(
      within(timeline).getByText('Reprise de la vérification'),
    ).toBeInTheDocument();
    expect(within(timeline).getByText('Validé')).toBeInTheDocument();
    expect(within(timeline).getByText('Déposé')).toBeInTheDocument();
  });

  test('branche rejected : statut terminal, aucune étape à venir', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/7/`, () =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: '7',
            status: 'rejected',
            document_type: 'baptism',
          }),
          rejection_reason: 'Acte introuvable dans les registres.',
          status_logs: [
            {
              to_status: 'submitted',
              created_at: '2026-07-01T10:00:00Z',
              comment: null,
            },
            {
              to_status: 'rejected',
              created_at: '2026-07-04T15:00:00Z',
              comment: null,
            },
          ],
        }),
      ),
    );

    renderApp(<DocumentDetail documentId="7" />);

    await screen.findByText('Motif du rejet');
    expect(
      screen.getByText('Acte introuvable dans les registres.'),
    ).toBeInTheDocument();

    const timeline = screen.getByRole('list', { name: 'Suivi de la demande' });
    expect(within(timeline).getByText('Refusé')).toBeInTheDocument();
    // Terminal : plus d'étapes « à venir ».
    expect(within(timeline).queryByText('Validé')).not.toBeInTheDocument();
    expect(within(timeline).queryByText('Déposé')).not.toBeInTheDocument();
  });

  test('document_deposited : panneau coffre-fort + téléchargement des pièces jointes', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/8/`, () =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: '8',
            status: 'document_deposited',
            document_type: 'baptism',
          }),
          attachments: [
            {
              id: 1,
              attachment_type: 'parish_final',
              attachment_type_label: 'Document final paroisse',
              label: 'Certificat signé',
              file_url: 'https://files.example/certificat.pdf',
              file_name: 'certificat.pdf',
              created_at: '2026-07-05T09:00:00Z',
            },
          ],
          status_logs: [],
        }),
      ),
    );

    renderApp(<DocumentDetail documentId="8" />);

    await screen.findByText('Document déposé');
    expect(screen.getByText(/coffre-fort numérique/i)).toBeInTheDocument();

    // Action de téléchargement conservée.
    const download = screen.getByRole('link', { name: /télécharger/i });
    expect(download).toHaveAttribute(
      'href',
      'https://files.example/certificat.pdf',
    );
  });

  test('shows supplement form when status is info_requested', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/3/`, () =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: '3',
            status: 'info_requested',
            document_type: 'Mariage',
          }),
          status_logs: [],
        }),
      ),
    );

    renderApp(<DocumentDetail documentId="3" />);

    await screen.findByText(/informations complémentaires demandées/i);
    expect(
      screen.getByPlaceholderText(/apportez les précisions demandées/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /envoyer le complément/i }),
    ).toBeInTheDocument();
  });

  test('does not show supplement form for non-info_requested statuses', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/2/`, () =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: '2',
            status: 'validated',
            document_type: 'Confirmation',
          }),
          status_logs: [],
        }),
      ),
    );

    renderApp(<DocumentDetail documentId="2" />);

    await screen.findByText('Confirmation');
    expect(
      screen.queryByText(/informations complémentaires demandées/i),
    ).not.toBeInTheDocument();
  });

  test('submits supplement and shows confirmation on success', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/3/`, () =>
        HttpResponse.json({
          ...createDocumentRequest({
            id: '3',
            status: 'info_requested',
            document_type: 'Mariage',
          }),
          status_logs: [],
        }),
      ),
      http.post(
        `${env.API_URL}/v1/documents/requests/3/supplement/`,
        async ({ request }) => {
          const body = (await request.json()) as { notes: string };
          return HttpResponse.json({
            detail: 'Informations envoyées.',
            notes: body.notes,
          });
        },
      ),
    );

    renderApp(<DocumentDetail documentId="3" />);

    const textarea = await screen.findByPlaceholderText(
      /apportez les précisions demandées/i,
    );
    await userEvent.type(textarea, 'Voici les informations demandées.');
    await userEvent.click(
      screen.getByRole('button', { name: /envoyer le complément/i }),
    );

    await screen.findByText(/vos informations ont été envoyées à la paroisse/i);
  });

  test('404 : affiche « Demande introuvable » avec retour aux documents', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/999/`, () =>
        HttpResponse.json(
          { message: 'Document introuvable.' },
          { status: 404 },
        ),
      ),
    );

    renderApp(<DocumentDetail documentId="999" />);

    await screen.findByText('Demande introuvable');
    expect(
      screen.getByRole('link', { name: /retour à mes documents/i }),
    ).toHaveAttribute('href', '/app/documents');
  });

  test('erreur serveur : ErrorState avec retry qui recharge la demande', async () => {
    let calls = 0;
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/4/`, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { message: 'Erreur interne.' },
            { status: 500 },
          );
        }
        return HttpResponse.json({
          ...createDocumentRequest({
            id: '4',
            status: 'submitted',
            document_type: 'baptism',
          }),
          status_logs: [],
        });
      }),
    );

    renderApp(<DocumentDetail documentId="4" />);

    await screen.findByText(/impossible de charger cette demande/i);
    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    await screen.findByText('Certificat de baptême');
  });
});
