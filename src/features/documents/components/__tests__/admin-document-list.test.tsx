import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createDocumentRequest } from '@/testing/data-generators';
import { renderApp } from '@/testing/test-utils';

import { AdminDocumentList } from '../admin-document-list';

/**
 * La DataTable rend chaque ligne deux fois (table desktop + carte mobile,
 * départagées par du CSS que jsdom n'applique pas) : on cible le premier
 * rendu, ou la table sémantique quand l'ordre des lignes est en jeu.
 */
async function openRowActions(name: string) {
  const [trigger] = await screen.findAllByRole('button', { name });
  await userEvent.click(trigger);
}

describe('AdminDocumentList — action principale visible par statut', () => {
  test('une demande soumise expose « Démarrer la vérification » en bouton, et « Rejeter » en secondaire', async () => {
    const doc = createDocumentRequest({
      document_type: 'Baptême',
      requester_name: 'Awa Ndiaye',
      status: 'submitted',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    expect(
      (
        await screen.findAllByRole('button', {
          name: /démarrer la vérification/i,
        })
      ).length,
    ).toBeGreaterThan(0);

    await openRowActions('Actions pour Baptême de Awa Ndiaye');

    expect(
      await screen.findByRole('menuitem', { name: /rejeter/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /démarrer la vérification/i }),
    ).not.toBeInTheDocument();
  });

  test('une demande en vérification expose « Transmettre au curé », le menu gardant la demande d’info', async () => {
    const doc = createDocumentRequest({
      document_type: 'Confirmation',
      requester_name: 'Moussa Diop',
      status: 'under_verification',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    expect(
      (await screen.findAllByRole('button', { name: /transmettre au curé/i }))
        .length,
    ).toBeGreaterThan(0);

    await openRowActions('Actions pour Confirmation de Moussa Diop');

    expect(
      await screen.findByRole('menuitem', {
        name: /demander une information/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /rejeter/i }),
    ).toBeInTheDocument();
  });

  test('une demande en attente du fidèle n’expose aucune action principale', async () => {
    const doc = createDocumentRequest({
      document_type: 'Mariage',
      requester_name: 'Marie Gomis',
      status: 'info_requested',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    await screen.findAllByText('Mariage');
    expect(
      screen.queryAllByRole('button', { name: /démarrer la vérification/i }),
    ).toHaveLength(0);
    expect(
      screen.queryAllByRole('button', { name: /transmettre au curé/i }),
    ).toHaveLength(0);
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

describe('AdminDocumentList — priorisation par SLA', () => {
  test('ordonne la file du plus ancien au plus récent, les demandes en veille en fin de file', async () => {
    const documents = [
      createDocumentRequest({
        id: 'recent',
        document_type: 'Parrain',
        status: 'submitted',
        sla_days: 1,
        sla_threshold_days: 7,
      }),
      createDocumentRequest({
        id: 'dormant',
        document_type: 'Mariage',
        status: 'info_requested',
        sla_days: 30,
        sla_threshold_days: 5,
      }),
      createDocumentRequest({
        id: 'late',
        document_type: 'Confirmation',
        status: 'submitted',
        sla_days: 16,
        sla_threshold_days: 7,
        is_escalated: true,
      }),
    ];

    renderApp(<AdminDocumentList documents={documents} />);

    const table = await screen.findByRole('table');
    const rows = within(table).getAllByRole('row').slice(1); // hors en-tête

    expect(rows[0]).toHaveTextContent('Confirmation');
    expect(rows[1]).toHaveTextContent('Parrain');
    expect(rows[2]).toHaveTextContent('Mariage');
  });

  test('signale le retard des demandes au-delà du seuil d’escalade', async () => {
    const doc = createDocumentRequest({
      document_type: 'Confirmation',
      status: 'submitted',
      sla_days: 16,
      sla_threshold_days: 7,
      is_escalated: true,
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    const [chip] = await screen.findAllByText('J+16 · en retard');
    expect(chip).toHaveClass('text-destructive');
  });

  test('met en veille — sans alerte — une demande qui attend le fidèle', async () => {
    const doc = createDocumentRequest({
      document_type: 'Mariage',
      status: 'info_requested',
      sla_days: 30,
      sla_threshold_days: 5,
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    const [chip] = await screen.findAllByText('En attente du fidèle');
    expect(chip).toHaveClass('text-muted-foreground');
    expect(screen.queryByText(/en retard/i)).not.toBeInTheDocument();
  });

  test('affiche la référence officielle de la demande', async () => {
    const doc = createDocumentRequest({
      document_type: 'Baptême',
      status: 'submitted',
      reference: 'DOC-2026-0301',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    expect(
      (await screen.findAllByText(/DOC-2026-0301/)).length,
    ).toBeGreaterThan(0);
  });
});

describe('AdminDocumentList — densité de la ligne', () => {
  test('réunit requérant, référence, paroisse et date sur une seule ligne', async () => {
    const doc = createDocumentRequest({
      document_type: 'Baptême',
      requester_name: 'Awa Ndiaye',
      reference: 'DOC-2026-0301',
      parish_name: 'Saint-Joseph',
      created_at: '2026-01-03T10:00:00Z',
      status: 'submitted',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    // Une seule ligne de contexte remplace trois lignes empilées et deux
    // colonnes dédiées (paroisse, date de réception).
    const [context] = await screen.findAllByText(
      /Awa Ndiaye · Réf\. DOC-2026-0301 · Saint-Joseph · reçue le 3 janv\. 2026/,
    );
    expect(context).toBeInTheDocument();
  });

  test('reste lisible quand référence et paroisse manquent', async () => {
    const doc = createDocumentRequest({
      document_type: 'Baptême',
      requester_name: 'Awa Ndiaye',
      reference: null,
      parish_name: null,
      created_at: '2026-01-03T10:00:00Z',
      status: 'submitted',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    const [context] = await screen.findAllByText(
      /^Awa Ndiaye · reçue le 3 janv\. 2026$/,
    );
    expect(context).toBeInTheDocument();
  });
});

describe('AdminDocumentList — vue mobile exploitable', () => {
  test('rend une liste de demandes hors du tableau, sans libellés répétés', async () => {
    const doc = createDocumentRequest({
      id: 'm-1',
      document_type: 'Baptême',
      requester_name: 'Awa Ndiaye',
      status: 'submitted',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    const table = await screen.findByRole('table');
    const mobileList = screen.getByRole('list');
    expect(mobileList).not.toBe(table);
    expect(mobileList).toHaveTextContent('Baptême');
    // Les paires libellé/valeur de la DataTable (« Délai », « Statut »…)
    // n'ont pas leur place sur une file de traitement : la donnée suffit.
    expect(mobileList).not.toHaveTextContent('Délai');
    expect(mobileList).not.toHaveTextContent('Statut');
  });

  test('l’action principale est atteignable depuis la ligne mobile', async () => {
    const doc = createDocumentRequest({
      id: 'm-2',
      document_type: 'Baptême',
      requester_name: 'Awa Ndiaye',
      status: 'submitted',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    const mobileList = await screen.findByRole('list');
    expect(
      within(mobileList).getByRole('button', {
        name: /démarrer la vérification/i,
      }),
    ).toBeInTheDocument();
  });

  test('une demande clôturée n’ouvre aucune zone d’action vide', async () => {
    const doc = createDocumentRequest({
      id: 'm-3',
      document_type: 'Baptême',
      requester_name: 'Awa Ndiaye',
      status: 'document_deposited',
    });

    renderApp(<AdminDocumentList documents={[doc]} />);

    const mobileList = await screen.findByRole('list');
    expect(within(mobileList).queryAllByRole('button')).toHaveLength(0);
  });

  test('affiche un état de chargement unique, pas un par présentation', () => {
    const { container } = renderApp(
      <AdminDocumentList documents={[]} isLoading />,
    );

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(
      screen.queryByText(/aucune demande à traiter/i),
    ).not.toBeInTheDocument();
  });
});
