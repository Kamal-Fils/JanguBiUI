import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createDocumentRequest } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { DocumentRequest } from '../../types';
import { DocumentsList } from '../documents-list';

/** Réponse paginée de `/v1/documents/requests/`. */
function mockRequests(results: DocumentRequest[]) {
  server.use(
    http.get(`${env.API_URL}/v1/documents/requests/`, () =>
      HttpResponse.json({ count: results.length, results }),
    ),
  );
}

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
    mockRequests([
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
    ]);

    renderApp(<DocumentsList />);

    await screen.findByText('Baptême');
    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });

  test('shows status badge for each document', async () => {
    mockRequests([
      createDocumentRequest({
        id: '1',
        document_type: 'Mariage',
        status: 'info_requested',
      }),
    ]);

    renderApp(<DocumentsList />);

    await screen.findByText('Infos requises');
  });

  test('shows empty state message when no documents', async () => {
    mockRequests([]);

    renderApp(<DocumentsList />);

    await screen.findByText(/demandez votre premier document/i);
    expect(
      screen.getByText(/déposez votre demande en ligne/i),
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
    mockRequests([
      createDocumentRequest({
        id: '42',
        document_type: 'Baptême',
        status: 'submitted',
      }),
    ]);

    renderApp(<DocumentsList />);

    const link = await screen.findByRole('link', { name: /baptême/i });
    expect(link).toHaveAttribute('href', '/app/documents/42');
  });

  test('renders safely when optional fields notes and parish_name are null', async () => {
    mockRequests([
      createDocumentRequest({
        id: '1',
        document_type: 'Extrait de registre',
        status: 'submitted',
        notes: null,
        parish_name: null,
        reference: null,
      }),
    ]);

    renderApp(<DocumentsList />);

    await screen.findByText('Extrait de registre');
  });

  // --- Hub de suivi (D2) ---------------------------------------------------

  test('shows the mini track at the stage matching each status', async () => {
    mockRequests([
      createDocumentRequest({ id: '1', status: 'submitted' }),
      createDocumentRequest({ id: '2', status: 'validated' }),
    ]);

    renderApp(<DocumentsList />);

    await screen.findByRole('img', {
      name: 'Étape 1 sur 4 : Soumise. Statut : Soumis.',
    });
    expect(
      screen.getByRole('img', {
        name: 'Étape 3 sur 4 : Validée. Statut : Validé.',
      }),
    ).toBeInTheDocument();
  });

  test('shows the official reference alongside the parish', async () => {
    mockRequests([
      createDocumentRequest({
        id: '1',
        status: 'submitted',
        parish_name: 'Paroisse Saint-Joseph de Médina',
        reference: 'DOC-2026-0327',
      }),
    ]);

    renderApp(<DocumentsList />);

    await screen.findByText(
      'Paroisse Saint-Joseph de Médina · Réf. DOC-2026-0327',
    );
  });

  test('raises an action required card when the parish awaits an answer', async () => {
    mockRequests([
      createDocumentRequest({
        id: '9',
        document_type: 'religious_marriage',
        status: 'info_requested',
        parish_name: 'Paroisse Sainte-Anne de Bel-Air',
      }),
    ]);

    renderApp(<DocumentsList />);

    await screen.findByText('Action requise');
    expect(
      screen.getByRole('link', { name: /répondre à la paroisse/i }),
    ).toHaveAttribute('href', '/app/documents/9');
  });

  test('shows no action required card when nothing awaits the user', async () => {
    mockRequests([
      createDocumentRequest({ id: '1', status: 'under_verification' }),
      createDocumentRequest({ id: '2', status: 'document_deposited' }),
    ]);

    renderApp(<DocumentsList />);

    await screen.findByText('En cours');
    expect(screen.queryByText('Action requise')).not.toBeInTheDocument();
  });

  test('offers the vault as a permanent card counting delivered documents', async () => {
    const onOpenVault = vi.fn();
    mockRequests([
      createDocumentRequest({ id: '1', status: 'document_deposited' }),
      createDocumentRequest({ id: '2', status: 'submitted' }),
    ]);

    renderApp(<DocumentsList onOpenVault={onOpenVault} />);

    const vaultButton = await screen.findByRole('button', {
      name: /coffre-fort numérique/i,
    });
    expect(vaultButton).toHaveTextContent('1 document délivré');

    await userEvent.click(vaultButton);
    expect(onOpenVault).toHaveBeenCalledOnce();
  });

  test('hides the vault card when the page cannot open the vault', async () => {
    mockRequests([
      createDocumentRequest({ id: '1', status: 'document_deposited' }),
    ]);

    renderApp(<DocumentsList />);

    await screen.findByRole('button', { name: /terminées/i });
    expect(
      screen.queryByRole('button', { name: /coffre-fort numérique/i }),
    ).not.toBeInTheDocument();
  });

  test('collapses finished requests by default and expands them on demand', async () => {
    mockRequests([
      createDocumentRequest({
        id: '1',
        document_type: 'confirmation',
        status: 'document_deposited',
      }),
      createDocumentRequest({
        id: '2',
        document_type: 'first_communion',
        status: 'rejected',
      }),
    ]);

    renderApp(<DocumentsList />);

    const toggle = await screen.findByRole('button', { name: /terminées/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText('Attestation de confirmation'),
    ).not.toBeInTheDocument();

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Attestation de confirmation')).toBeInTheDocument();
    expect(
      screen.getByText('Attestation de première communion'),
    ).toBeInTheDocument();
  });

  test('keeps finished requests out of the in-progress section', async () => {
    mockRequests([
      createDocumentRequest({ id: '1', status: 'submitted' }),
      createDocumentRequest({ id: '2', status: 'rejected' }),
    ]);

    renderApp(<DocumentsList />);

    const inProgress = await screen.findByRole('region', {
      name: 'Demandes en cours',
    });
    expect(inProgress).toHaveTextContent('1 demande');
    expect(
      screen.getByRole('button', { name: /terminées/i }),
    ).toHaveTextContent('1 demande');
  });
});
