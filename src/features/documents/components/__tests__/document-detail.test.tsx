import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createDocumentRequest } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { DocumentDetail } from '../document-detail';

describe('DocumentDetail', () => {
  test('shows loading spinner while fetching', async () => {
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

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).not.toBeNull();
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
    expect(screen.getByText('Soumis')).toBeInTheDocument();
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

  test('shows error message when document request fails', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/999/`, () =>
        HttpResponse.json(
          { message: 'Document introuvable.' },
          { status: 404 },
        ),
      ),
    );

    renderApp(<DocumentDetail documentId="999" />);

    await screen.findByText(/impossible de charger cette demande/i);
  });
});
