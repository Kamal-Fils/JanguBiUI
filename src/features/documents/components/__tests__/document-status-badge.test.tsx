import { render, screen } from '@testing-library/react';

import type { DocumentStatus } from '../../types';
import { DocumentStatusBadge } from '../document-status-badge';

describe('DocumentStatusBadge', () => {
  const statuses: { status: DocumentStatus; expectedLabel: string }[] = [
    { status: 'submitted', expectedLabel: 'Soumis' },
    { status: 'under_verification', expectedLabel: 'En vérification' },
    { status: 'validated', expectedLabel: 'Validé' },
    { status: 'document_deposited', expectedLabel: 'Déposé' },
    { status: 'info_requested', expectedLabel: 'Infos requises' },
    { status: 'rejected', expectedLabel: 'Refusé' },
  ];

  statuses.forEach(({ status, expectedLabel }) => {
    test(`renders correct label for status "${status}"`, () => {
      render(<DocumentStatusBadge status={status} />);
      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });
  });

  test('applies blue styling for submitted status', () => {
    render(<DocumentStatusBadge status="submitted" />);
    const badge = screen.getByText('Soumis');
    expect(badge).toHaveClass('text-blue-600');
  });

  test('applies green styling for validated status', () => {
    render(<DocumentStatusBadge status="validated" />);
    const badge = screen.getByText('Validé');
    expect(badge).toHaveClass('text-green-600');
  });

  test('applies orange styling for info_requested status', () => {
    render(<DocumentStatusBadge status="info_requested" />);
    const badge = screen.getByText('Infos requises');
    expect(badge).toHaveClass('text-orange-600');
  });

  test('applies destructive styling for rejected status', () => {
    render(<DocumentStatusBadge status="rejected" />);
    const badge = screen.getByText('Refusé');
    expect(badge).toHaveClass('text-destructive');
  });
});
