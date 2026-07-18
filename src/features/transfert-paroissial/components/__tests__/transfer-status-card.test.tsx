import { screen } from '@testing-library/react';

import { renderApp } from '@/testing/test-utils';

import type { TransferRequest } from '../../types';
import { TransferStatusCard } from '../transfer-status-card';

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

describe('TransferStatusCard', () => {
  test('affiche le trajet, le motif et la timeline complète du workflow', () => {
    renderApp(<TransferStatusCard transfer={makeTransfer()} />);

    expect(screen.getByText('Paroisse Saint-Pierre')).toBeInTheDocument();
    expect(screen.getByText('Paroisse Sainte-Anne')).toBeInTheDocument();
    expect(screen.getByText(/Déménagement à Thiès/)).toBeInTheDocument();
    expect(screen.getByText(/Demande soumise le/)).toBeInTheDocument();

    // Badge + étape courante de la timeline portent le même libellé.
    expect(screen.getAllByText('En attente').length).toBeGreaterThan(0);
    // Étapes à venir du workflow linéaire.
    expect(screen.getByText("Approuvé par l'origine")).toBeInTheDocument();
    expect(screen.getByText('Accusé réception')).toBeInTheDocument();
    expect(screen.getByText('Transfert effectué')).toBeInTheDocument();
  });

  test('demande refusée : motif du refus mis en avant', () => {
    renderApp(
      <TransferStatusCard
        transfer={makeTransfer({
          status: 'rejected',
          rejection_reason: 'Dossier incomplet',
        })}
      />,
    );

    expect(screen.getByText('Motif du refus')).toBeInTheDocument();
    expect(screen.getByText('Dossier incomplet')).toBeInTheDocument();
    expect(screen.getAllByText('Refusé').length).toBeGreaterThan(0);
  });

  test('transfert effectué : message de bienvenue dans la nouvelle paroisse', () => {
    renderApp(
      <TransferStatusCard transfer={makeTransfer({ status: 'completed' })} />,
    );

    expect(
      screen.getByText(/Votre transfert paroissial est effectif/),
    ).toBeInTheDocument();
  });
});
