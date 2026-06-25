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

  test('applies the info tone for submitted status', () => {
    render(<DocumentStatusBadge status="submitted" />);
    const badge = screen.getByText('Soumis');
    expect(badge).toHaveClass('text-info');
  });

  test('applies the success tone for validated status', () => {
    render(<DocumentStatusBadge status="validated" />);
    const badge = screen.getByText('Validé');
    expect(badge).toHaveClass('text-success');
  });

  test('applies the accent tone for info_requested status', () => {
    render(<DocumentStatusBadge status="info_requested" />);
    const badge = screen.getByText('Infos requises');
    expect(badge).toHaveClass('text-gold-ink');
  });

  test('applies the destructive tone for rejected status', () => {
    render(<DocumentStatusBadge status="rejected" />);
    const badge = screen.getByText('Refusé');
    expect(badge).toHaveClass('text-destructive');
  });

  // La couleur n'est jamais le seul signal de statut (WCAG 1.4.1) : un libellé
  // ET une icône accompagnent chaque ton.
  test('renders an icon alongside the label', () => {
    render(<DocumentStatusBadge status="validated" />);
    expect(screen.getByText('Validé').querySelector('svg')).toBeInTheDocument();
  });
});
