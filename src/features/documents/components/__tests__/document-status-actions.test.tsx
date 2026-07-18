import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { DocumentStatusActions } from '../document-status-actions';

const SUBJECT = 'Certificat de baptême de Awa Ndiaye';

const openMenu = async () => {
  await userEvent.click(
    screen.getByRole('button', { name: `Actions pour ${SUBJECT}` }),
  );
};

describe('DocumentStatusActions — action principale visible par statut', () => {
  test('une demande soumise propose « Démarrer la vérification » en bouton', async () => {
    renderApp(
      <DocumentStatusActions
        requestId="1"
        status="submitted"
        subject={SUBJECT}
      />,
    );

    const primary = screen.getByRole('button', {
      name: /démarrer la vérification/i,
    });
    expect(primary).toBeInTheDocument();
    // …et l'acte le plus fréquent ne se cache plus dans le menu « ⋯ ».
    await openMenu();
    expect(
      screen.queryByRole('menuitem', { name: /démarrer la vérification/i }),
    ).not.toBeInTheDocument();
  });

  test('une demande en vérification propose « Transmettre au curé »', () => {
    renderApp(
      <DocumentStatusActions
        requestId="1"
        status="under_verification"
        subject={SUBJECT}
      />,
    );

    expect(
      screen.getByRole('button', { name: /transmettre au curé/i }),
    ).toBeInTheDocument();
  });

  test('une demande validée propose l’acte de signature du curé', () => {
    renderApp(
      <DocumentStatusActions
        requestId="1"
        status="validated"
        subject={SUBJECT}
      />,
    );

    expect(
      screen.getByRole('button', { name: /signer et déposer/i }),
    ).toBeInTheDocument();
  });

  test('une demande en attente du fidèle n’a pas d’action principale', async () => {
    renderApp(
      <DocumentStatusActions
        requestId="1"
        status="info_requested"
        subject={SUBJECT}
      />,
    );

    // Rien à faire côté paroisse : seules les actions secondaires subsistent.
    expect(
      screen.queryByRole('button', { name: /démarrer la vérification/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^signer et déposer/i }),
    ).not.toBeInTheDocument();

    await openMenu();
    expect(
      await screen.findByRole('menuitem', {
        name: /demander une information/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /transmettre au curé/i }),
    ).toBeInTheDocument();
  });

  test('un statut terminal ne propose aucune action', () => {
    renderApp(
      <DocumentStatusActions
        requestId="1"
        status="document_deposited"
        subject={SUBJECT}
      />,
    );

    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  test('le bouton principal déclenche bien la transition backend', async () => {
    let calledId = '';
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/admin/requests/:id/start-verification/`,
        ({ params }) => {
          calledId = String(params.id);
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    renderApp(
      <DocumentStatusActions
        requestId="req-42"
        status="submitted"
        subject={SUBJECT}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /démarrer la vérification/i }),
    );

    await waitFor(() => expect(calledId).toBe('req-42'));
  });
});

describe('DocumentStatusActions — dialogues à motif obligatoire (conservés)', () => {
  test('le rejet reste bloqué tant qu’aucun motif n’est saisi', async () => {
    renderApp(
      <DocumentStatusActions
        requestId="1"
        status="submitted"
        subject={SUBJECT}
      />,
    );

    await openMenu();
    await userEvent.click(screen.getByRole('menuitem', { name: /rejeter/i }));

    const dialog = await screen.findByRole('dialog');
    const confirm = screen.getByRole('button', { name: 'Rejeter' });
    expect(confirm).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText(/motif du rejet/i),
      'Acte introuvable au registre.',
    );

    expect(confirm).toBeEnabled();
    expect(dialog).toBeInTheDocument();
  });

  test('la demande d’information reste bloquée tant qu’aucun message n’est saisi', async () => {
    renderApp(
      <DocumentStatusActions
        requestId="1"
        status="under_verification"
        subject={SUBJECT}
      />,
    );

    await openMenu();
    await userEvent.click(
      screen.getByRole('menuitem', { name: /demander une information/i }),
    );

    await screen.findByRole('dialog');
    const send = screen.getByRole('button', { name: /envoyer/i });
    expect(send).toBeDisabled();

    await userEvent.type(
      screen.getByLabelText(/message pour le requérant/i),
      'Merci de fournir l’acte de naissance.',
    );

    expect(send).toBeEnabled();
  });
});
