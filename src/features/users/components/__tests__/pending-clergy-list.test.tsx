import { screen } from '@testing-library/react';

import { renderApp } from '@/testing/test-utils';

import type { PendingClergyAccount } from '../../api/get-pending-clergy';
import { PendingClergyList } from '../pending-clergy-list';

const createPendingAccount = (
  overrides?: Partial<PendingClergyAccount>,
): PendingClergyAccount => ({
  id: 'clergy-1',
  email: 'abbe.sene@diocese.sn',
  pastoral_role: 'pretre',
  first_name: 'Jean',
  last_name: 'Sène',
  diocese_name: 'Dakar',
  parish_name: 'Paroisse Saint-Joseph',
  date_joined: '2026-07-01T00:00:00Z',
  ...overrides,
});

describe('PendingClergyList — validation hiérarchique (workflow inchangé)', () => {
  test('un compte en attente expose les actions Approuver et Refuser', () => {
    const account = createPendingAccount();

    renderApp(
      <PendingClergyList accounts={[account]} totalCount={1} isLoading={false} />,
    );

    expect(screen.getByText('Jean Sène')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /approuver/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refuser/i })).toBeInTheDocument();
  });

  test('affiche le compteur de comptes en attente', () => {
    renderApp(
      <PendingClergyList
        accounts={[
          createPendingAccount({ id: '1', email: 'a@diocese.sn' }),
          createPendingAccount({ id: '2', email: 'b@diocese.sn' }),
        ]}
        totalCount={2}
        isLoading={false}
      />,
    );

    expect(
      screen.getByText(/2 comptes en attente de validation/i),
    ).toBeInTheDocument();
  });

  test('affiche l’état vide quand tous les comptes ont été traités', () => {
    renderApp(
      <PendingClergyList accounts={[]} totalCount={0} isLoading={false} />,
    );

    expect(screen.getByText(/aucun compte en attente/i)).toBeInTheDocument();
    expect(
      screen.getByText(/tous les comptes clergé ont été traités/i),
    ).toBeInTheDocument();
  });
});
