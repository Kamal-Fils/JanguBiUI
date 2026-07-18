import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createDocumentRequest } from '@/testing/data-generators';
import { renderApp } from '@/testing/test-utils';

import { AdminDocumentList } from '../admin-document-list';

/**
 * Les actions par ligne vivent dans un menu « ⋯ » — on l'ouvre avant d'asserter.
 * La DataTable rend chaque ligne deux fois (table desktop + carte mobile,
 * départagées par CSS que jsdom n'applique pas) : on ouvre le premier menu.
 */
async function openRowActions(name: string) {
  const [trigger] = await screen.findAllByRole('button', { name });
  await userEvent.click(trigger);
}

describe('AdminDocumentList — actions « ⋯ » par statut (workflow inchangé)', () => {
  test('une demande soumise propose Démarrer la vérification et Rejeter, pas Valider', async () => {
    const doc = createDocumentRequest({
      document_type: 'Baptême',
      requester_name: 'Awa Ndiaye',
      status: 'submitted',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    await openRowActions('Actions pour Baptême de Awa Ndiaye');

    expect(
      await screen.findByRole('menuitem', { name: /démarrer la vérification/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /rejeter/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /^valider$/i }),
    ).not.toBeInTheDocument();
  });

  test('une demande en vérification propose Demander une information et Valider', async () => {
    const doc = createDocumentRequest({
      document_type: 'Confirmation',
      requester_name: 'Moussa Diop',
      status: 'under_verification',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    await openRowActions('Actions pour Confirmation de Moussa Diop');

    expect(
      await screen.findByRole('menuitem', {
        name: /demander une information/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /^valider$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /rejeter/i }),
    ).toBeInTheDocument();
  });

  test('une demande déposée (statut terminal) ne montre aucun menu d’actions', async () => {
    const doc = createDocumentRequest({
      document_type: 'Baptême',
      requester_name: 'Awa Ndiaye',
      status: 'document_deposited',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    await screen.findAllByText('Baptême');
    expect(
      screen.queryAllByRole('button', {
        name: 'Actions pour Baptême de Awa Ndiaye',
      }),
    ).toHaveLength(0);
  });

  test('affiche l’état vide incitatif quand il n’y a aucune demande', () => {
    renderApp(<AdminDocumentList documents={[]} />);

    expect(screen.getByText(/aucune demande à traiter/i)).toBeInTheDocument();
    expect(
      screen.getByText(/les nouvelles demandes des fidèles/i),
    ).toBeInTheDocument();
  });
});
