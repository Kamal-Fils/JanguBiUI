import { render, screen } from '@testing-library/react';

import { createDocumentRequest } from '@/testing/data-generators';

import { ActionRequiredCard } from '../action-required-card';

describe('ActionRequiredCard', () => {
  test('renders nothing when no request awaits the user', () => {
    const { container } = render(<ActionRequiredCard documents={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  test('names the document and the parish that awaits an answer', () => {
    render(
      <ActionRequiredCard
        documents={[
          createDocumentRequest({
            id: '7',
            document_type: 'religious_marriage',
            status: 'info_requested',
            parish_name: 'Paroisse Sainte-Anne de Bel-Air',
          }),
        ]}
      />,
    );

    expect(screen.getByText('Action requise')).toBeInTheDocument();
    expect(
      screen.getByText('Attestation de mariage religieux'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Paroisse Sainte-Anne de Bel-Air attend des précisions/i,
      ),
    ).toBeInTheDocument();
  });

  test('links its call to action to the tracking page of that request', () => {
    render(
      <ActionRequiredCard
        documents={[
          createDocumentRequest({ id: '42', status: 'info_requested' }),
        ]}
      />,
    );

    expect(
      screen.getByRole('link', { name: /répondre à la paroisse/i }),
    ).toHaveAttribute('href', '/app/documents/42');
  });

  test('falls back to a generic sentence when the parish is unknown', () => {
    render(
      <ActionRequiredCard
        documents={[
          createDocumentRequest({
            status: 'info_requested',
            parish_name: null,
          }),
        ]}
      />,
    );

    expect(
      screen.getByText(/Votre paroisse attend des précisions/i),
    ).toBeInTheDocument();
  });

  test('lists every request with its own link when several await an answer', () => {
    render(
      <ActionRequiredCard
        documents={[
          createDocumentRequest({
            id: '1',
            document_type: 'baptism',
            status: 'info_requested',
          }),
          createDocumentRequest({
            id: '2',
            document_type: 'confirmation',
            status: 'info_requested',
          }),
        ]}
      />,
    );

    expect(
      screen.getByText('2 demandes attendent votre réponse'),
    ).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/app/documents/1');
    expect(links[1]).toHaveAttribute('href', '/app/documents/2');
  });
});
