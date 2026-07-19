import { screen } from '@testing-library/react';

import { renderApp } from '@/testing/test-utils';

import type { ClergyDeclaration } from '../../api/get-my-clergy-declaration';
import { ClergyDeclarationStatus } from '../clergy-declaration-status';

const createDeclaration = (
  overrides?: Partial<ClergyDeclaration>,
): ClergyDeclaration => ({
  id: 1,
  claimed_pastoral_role: 'pretre',
  status: 'pending',
  parish_id: 7,
  parish_name: 'Paroisse Saint-Joseph',
  message: '',
  rejection_reason: '',
  justification_file_url: null,
  submitted_at: '2026-07-01T10:00:00Z',
  reviewed_at: null,
  ...overrides,
});

describe('ClergyDeclarationStatus — suivi de ma demande', () => {
  test('une demande en attente annonce qu’aucun accès n’est encore ouvert', () => {
    renderApp(<ClergyDeclarationStatus declaration={createDeclaration()} />);

    expect(screen.getByText(/en attente de validation/i)).toBeInTheDocument();
    expect(
      screen.getByText(/votre compte reste un compte fidèle/i),
    ).toBeInTheDocument();
  });

  test('affiche le rôle revendiqué et la paroisse de rattachement', () => {
    renderApp(
      <ClergyDeclarationStatus
        declaration={createDeclaration({ claimed_pastoral_role: 'diacre' })}
      />,
    );

    expect(screen.getByText('Diacre')).toBeInTheDocument();
    expect(screen.getByText('Paroisse Saint-Joseph')).toBeInTheDocument();
  });

  test('un refus restitue son motif — sans lui le refus est une impasse', () => {
    renderApp(
      <ClergyDeclarationStatus
        declaration={createDeclaration({
          status: 'rejected',
          rejection_reason: 'Attestation non signée.',
          reviewed_at: '2026-07-05T09:00:00Z',
        })}
      />,
    );

    expect(screen.getByText(/motif du refus/i)).toBeInTheDocument();
    expect(screen.getByText('Attestation non signée.')).toBeInTheDocument();
  });

  test('une demande approuvée annonce l’ouverture des accès clergé', () => {
    renderApp(
      <ClergyDeclarationStatus
        declaration={createDeclaration({ status: 'approved' })}
      />,
    );

    expect(screen.getByText(/validée/i)).toBeInTheDocument();
    expect(
      screen.getByText(/votre rôle pastoral est reconnu/i),
    ).toBeInTheDocument();
  });

  test('le justificatif transmis reste consultable', () => {
    renderApp(
      <ClergyDeclarationStatus
        declaration={createDeclaration({
          justification_file_url: 'https://files.test/justif.pdf',
        })}
      />,
    );

    expect(
      screen.getByRole('link', { name: /consulter la pièce transmise/i }),
    ).toHaveAttribute('href', 'https://files.test/justif.pdf');
  });
});
