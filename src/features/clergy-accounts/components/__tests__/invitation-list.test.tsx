import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderApp } from '@/testing/test-utils';

import type { ClergicalInvitation } from '../../types';
import { InvitationList } from '../invitation-list';

const createInvitation = (
  overrides?: Partial<ClergicalInvitation>,
): ClergicalInvitation => ({
  id: 1,
  token: '6f3f9d0e-1e64-4a3b-b8a5-3f4c2c9f1a2b',
  email: 'pretre@diocese.sn',
  first_name: 'Jean',
  last_name: 'Sène',
  pastoral_role: 'pretre',
  diocese_name: 'Dakar',
  status: 'pending',
  status_label: 'En attente',
  created_by_name: null,
  expires_at: '2026-08-01T00:00:00Z',
  created_at: '2026-07-01T00:00:00Z',
  ...overrides,
});

/**
 * Les actions par ligne vivent dans un menu « ⋯ » — la DataTable rend chaque
 * ligne deux fois (desktop + carte mobile) : on ouvre le premier menu.
 */
async function openRowActions(email: string) {
  const [trigger] = await screen.findAllByRole('button', {
    name: `Actions pour ${email}`,
  });
  await userEvent.click(trigger);
}

describe('InvitationList — menu « ⋯ » et états', () => {
  test('une invitation en attente propose Révoquer dans le menu « ⋯ »', async () => {
    const invitation = createInvitation({ status: 'pending' });

    renderApp(<InvitationList invitations={[invitation]} />);

    await openRowActions(invitation.email);

    expect(
      await screen.findByRole('menuitem', { name: /révoquer/i }),
    ).toBeInTheDocument();
  });

  test('une invitation acceptée ne montre aucun menu d’actions', async () => {
    const invitation = createInvitation({ status: 'accepted' });

    renderApp(<InvitationList invitations={[invitation]} />);

    await screen.findAllByText(invitation.email);
    expect(
      screen.queryAllByRole('button', {
        name: `Actions pour ${invitation.email}`,
      }),
    ).toHaveLength(0);
  });

  test('l’état vide est incitatif et mène vers la page d’invitation', () => {
    renderApp(<InvitationList invitations={[]} />);

    expect(
      screen.getByText(/invitez votre premier membre du clergé/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /nouvelle invitation/i }),
    ).toHaveAttribute('href', '/app/admin/users/invite');
  });
});
