import { screen } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createDocumentRequest } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { DocumentsList } from '../documents-list';

describe('DocumentsList', () => {
  test('shows loading skeleton while fetching data', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, async () => {
        await delay(Infinity);
        return HttpResponse.json({ count: 0, results: [] });
      }),
    );

    renderApp(<DocumentsList />);

    const skeletonItems = document.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  test('shows document list after loading', async () => {
    const mockDocs = [
      createDocumentRequest({
        id: '1',
        document_type: 'Baptême',
        status: 'submitted',
      }),
      createDocumentRequest({
        id: '2',
        document_type: 'Confirmation',
        status: 'validated',
      }),
    ];
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({ count: mockDocs.length, results: mockDocs }),
      ),
    );

    renderApp(<DocumentsList />);

    await screen.findByText('Baptême');
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });

  test('shows status badge for each document', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createDocumentRequest({
              id: '1',
              document_type: 'Mariage',
              status: 'info_requested',
            }),
          ],
        }),
      ),
    );

    renderApp(<DocumentsList />);

    await screen.findByText('Infos requises');
  });

  test('shows empty state message when no documents', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );

    renderApp(<DocumentsList />);

    await screen.findByText(/aucune demande/i);
    expect(
      screen.getByText(/vos demandes de documents apparaîtront ici/i),
    ).toBeInTheDocument();
  });

  test('shows error message when API request fails', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.error(),
      ),
    );

    renderApp(<DocumentsList />);

    await screen.findByText(/impossible de charger vos demandes/i);
  });

  test('each document links to its detail page', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createDocumentRequest({
              id: '42',
              document_type: 'Baptême',
              status: 'submitted',
            }),
          ],
        }),
      ),
    );

    renderApp(<DocumentsList />);

    const link = await screen.findByRole('link', { name: /baptême/i });
    expect(link).toHaveAttribute('href', '/app/documents/42');
  });

  test('renders safely when optional fields notes and parish_name are null', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/`, () =>
        HttpResponse.json({
          count: 1,
          results: [
            createDocumentRequest({
              id: '1',
              document_type: 'Extrait de registre',
              status: 'submitted',
              notes: null,
              parish_name: null,
            }),
          ],
        }),
      ),
    );

    renderApp(<DocumentsList />);

    await screen.findByText('Extrait de registre');
  });
});
