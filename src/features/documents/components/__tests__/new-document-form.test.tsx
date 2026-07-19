import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { createDocumentRequest, createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { NewDocumentForm } from '../new-document-form';

const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  push: mockRouterPush,
  back: mockRouterBack,
  replace: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
} as never);

// Paroisses d'appartenance du fidèle — proposées en tête par le picker (C7c).
const MEMBERSHIPS = [
  {
    id: 1,
    church: { id: 111, name: 'Église A' },
    parish: { id: 11, name: 'Saint-Pierre' },
    diocese: { id: 1, name: 'Diocèse de Dakar' },
    is_primary: true,
  },
];

function mockMe() {
  server.use(
    http.get(`${env.API_URL}/v1/auth/me/`, () =>
      HttpResponse.json(createUser({ memberships: MEMBERSHIPS })),
    ),
  );
}

/**
 * Référentiel du formulaire — reflet exact de `apps/documents/constants.py`.
 * C'est le serveur qui détient la règle « type ↔ motif » ; le formulaire la
 * consomme. On la sert donc ici plutôt que de la redéclarer dans le composant.
 */
const REASON_LABELS: Record<string, string> = {
  religious_marriage: 'Mariage religieux',
  godparent: 'Parrain / marraine',
  catechism: 'Inscription catéchèse',
  parish_file: 'Dossier paroissial',
  personal: 'Usage personnel',
  other: 'Autre',
};

const UNIVERSAL = ['parish_file', 'personal', 'other'];

const DOCUMENT_OPTIONS = {
  document_types: [
    {
      value: 'baptism',
      label: 'Certificat de baptême',
      requires_precision: false,
      allowed_reasons: [
        'religious_marriage',
        'godparent',
        'catechism',
        ...UNIVERSAL,
      ],
    },
    {
      value: 'first_communion',
      label: 'Attestation de première communion',
      requires_precision: false,
      allowed_reasons: ['catechism', ...UNIVERSAL],
    },
    {
      value: 'confirmation',
      label: 'Attestation de confirmation',
      requires_precision: false,
      allowed_reasons: ['religious_marriage', 'godparent', ...UNIVERSAL],
    },
    {
      value: 'religious_marriage',
      label: 'Attestation de mariage religieux',
      requires_precision: false,
      allowed_reasons: UNIVERSAL,
    },
    {
      value: 'godparent',
      label: 'Attestation parrain / marraine',
      requires_precision: false,
      allowed_reasons: UNIVERSAL,
    },
    {
      value: 'other',
      label: 'Autre document',
      requires_precision: true,
      allowed_reasons: Object.keys(REASON_LABELS),
    },
  ],
  reasons: Object.entries(REASON_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
};

function mockDocumentOptions() {
  server.use(
    http.get(`${env.API_URL}/v1/documents/requests/options/`, () =>
      HttpResponse.json(DOCUMENT_OPTIONS),
    ),
  );
}

/** Les cartes de type arrivent avec le référentiel : on attend son chargement. */
async function findTypeCard(name: RegExp) {
  return screen.findByRole('button', { name });
}

type User = ReturnType<typeof userEvent.setup>;

/**
 * `delay: null` supprime l'attente inter-frappe : l'étape « Détails » saisit
 * 10 champs, et le délai par défaut rendait ces tests fragiles (timeout) quand
 * la suite complète tourne en parallèle. Les événements émis sont identiques.
 */
function setupUser(): User {
  return userEvent.setup({ delay: null });
}

/**
 * Les champs d'identité/contact sont préremplis depuis le profil (valeurs
 * aléatoires en test) : on vide avant de saisir pour rendre le payload
 * déterministe.
 */
async function fill(user: User, field: HTMLElement, value: string) {
  await user.clear(field);
  await user.type(field, value);
}

// ── Navigation : 4 étapes nommées (Document · Paroisse · Détails · Validation) ─

/** Étape 1 → 2 : choisit le type de document et le motif. */
async function completeDocumentStep(user: User) {
  await user.click(await findTypeCard(/Certificat de baptême/));
  await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
  await user.click(screen.getByRole('button', { name: /continuer/i }));
  await screen.findByRole('heading', { name: 'Quelle paroisse ?' });
}

/** Étape 2 → 3 : sélectionne la paroisse du registre via le picker. */
async function completeParishStep(user: User) {
  await user.click(await screen.findByRole('button', { name: /Saint-Pierre/ }));
  await user.click(screen.getByRole('button', { name: /continuer/i }));
  await screen.findByRole('heading', { name: 'Vos informations' });
}

/** Étape 3 → 4 : identité + sacrement + contact (pièce jointe optionnelle). */
async function completeDetailsStep(user: User) {
  await fill(user, screen.getByLabelText(/prénom/i), 'Jean');
  await fill(user, screen.getByLabelText(/^nom \*/i), 'Dupont');
  await fill(user, screen.getByLabelText(/date de naissance/i), '2000-01-01');
  await fill(user, screen.getByLabelText(/lieu de naissance/i), 'Dakar');
  await fill(user, screen.getByLabelText(/nom du père/i), 'Dupont');
  await fill(user, screen.getByLabelText(/nom de la mère/i), 'Martin');
  await fill(user, screen.getByLabelText(/date approx/i), '2000');
  await fill(user, screen.getByLabelText(/^lieu \*/i), 'Dakar');
  await fill(user, screen.getByLabelText(/téléphone/i), '+221770000000');
  await fill(user, screen.getByLabelText(/email/i), 'jean@example.com');
  await user.click(screen.getByRole('button', { name: /continuer/i }));
  await screen.findByRole('heading', { name: 'Récapitulatif' });
}

/** Parcours complet jusqu'à l'étape 4 (Validation), consentement non coché. */
async function navigateToReview(user: User) {
  await completeDocumentStep(user);
  await completeParishStep(user);
  await completeDetailsStep(user);
}

describe('NewDocumentForm', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockRouterBack.mockReset();
    mockMe();
    mockDocumentOptions();
  });

  // ── Étape 1 — Document ─────────────────────────────────────────────────────

  test('affiche les 6 cartes de type enrichies (icône + description d’usage)', async () => {
    renderApp(<NewDocumentForm />);

    expect(await findTypeCard(/Certificat de baptême/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /Attestation de première communion/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Attestation de confirmation/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Attestation de mariage religieux/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Attestation parrain \/ marraine/ }),
    ).toBeInTheDocument();
    // « Autre document » : échappatoire quand aucun type ne convient.
    expect(
      screen.getByRole('button', { name: /Autre document/ }),
    ).toBeInTheDocument();

    // La description d'usage fait partie du repère de choix (maquette 02).
    expect(
      screen.getByText(/Le plus demandé — requis pour le mariage/),
    ).toBeInTheDocument();
  });

  test('la carte de type cliquée devient sélectionnée (aria-pressed)', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    const card = await findTypeCard(/Certificat de baptême/);
    expect(card).toHaveAttribute('aria-pressed', 'false');

    await user.click(card);

    expect(card).toHaveAttribute('aria-pressed', 'true');
  });

  test('impossible d’avancer depuis l’étape 1 sans type ni motif', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(screen.getByRole('button', { name: /continuer/i }));

    expect(
      await screen.findByText('Veuillez sélectionner un type de document'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Veuillez sélectionner un motif'),
    ).toBeInTheDocument();
    // Toujours sur l'étape 1.
    expect(
      screen.getByRole('heading', { name: 'Quel document ?' }),
    ).toBeInTheDocument();
  });

  // ── Étape 1 — Motifs conditionnels au type + « Autre » ─────────────────────

  test('les motifs proposés dépendent du type de document choisi', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    // Baptême : pièce du dossier de parrainage → « Parrain / marraine » proposé.
    await user.click(await findTypeCard(/Certificat de baptême/));
    expect(
      screen.getByRole('button', { name: 'Parrain / marraine' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Inscription catéchèse' }),
    ).toBeInTheDocument();

    // Mariage religieux : atteste un sacrement déjà célébré — ces deux motifs
    // n'ont plus de sens et disparaissent (le cas signalé par le client).
    await user.click(await findTypeCard(/Attestation de mariage religieux/));
    expect(
      screen.queryByRole('button', { name: 'Parrain / marraine' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Inscription catéchèse' }),
    ).not.toBeInTheDocument();
    // Les motifs universels restent proposés.
    expect(
      screen.getByRole('button', { name: 'Dossier paroissial' }),
    ).toBeInTheDocument();
  });

  test('changer de type réinitialise un motif devenu incompatible', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    // Baptême + parrain/marraine : combinaison valide.
    await user.click(await findTypeCard(/Certificat de baptême/));
    await user.click(screen.getByRole('button', { name: 'Parrain / marraine' }));
    expect(
      screen.getByRole('button', { name: 'Parrain / marraine' }),
    ).toHaveAttribute('aria-pressed', 'true');

    // Bascule sur mariage religieux : le motif ne s'applique plus → remis à zéro.
    await user.click(await findTypeCard(/Attestation de mariage religieux/));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    // Aucune valeur incohérente conservée : l'étape reste bloquée sur le motif.
    expect(
      await screen.findByText('Veuillez sélectionner un motif'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Quel document ?' }),
    ).toBeInTheDocument();
  });

  test('le motif reste sélectionné si le nouveau type l’autorise encore', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(await findTypeCard(/Certificat de baptême/));
    await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
    await user.click(await findTypeCard(/Attestation de mariage religieux/));

    expect(
      screen.getByRole('button', { name: 'Usage personnel' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('« Autre document » exige de préciser le document demandé', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(await findTypeCard(/Autre document/));
    await user.click(screen.getByRole('button', { name: 'Usage personnel' }));

    const precision = screen.getByLabelText(/Précisez le document demandé/);
    expect(precision).toBeInTheDocument();

    // Laissé vide → blocage.
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(
      await screen.findByText('Veuillez préciser le document demandé'),
    ).toBeInTheDocument();

    // Renseigné → l'étape passe.
    await fill(user, precision, 'Certificat de profession religieuse');
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(
      await screen.findByRole('heading', { name: 'Quelle paroisse ?' }),
    ).toBeInTheDocument();
  });

  test('le motif « Autre » exige de préciser le motif', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(await findTypeCard(/Certificat de baptême/));
    await user.click(screen.getByRole('button', { name: 'Autre' }));

    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(
      await screen.findByText('Veuillez préciser le motif'),
    ).toBeInTheDocument();

    await fill(
      user,
      screen.getByLabelText(/Précisez le motif/),
      'Dossier de naturalisation',
    );
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    expect(
      await screen.findByRole('heading', { name: 'Quelle paroisse ?' }),
    ).toBeInTheDocument();
  });

  test('référentiel indisponible : message explicite, pas d’étape muette', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/documents/requests/options/`, () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );

    renderApp(<NewDocumentForm />);

    expect(
      await screen.findByText(/Impossible de charger les types de document/),
    ).toBeInTheDocument();
  });

  test('le champ de précision du type disparaît si le type n’est plus « Autre »', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(await findTypeCard(/Autre document/));
    expect(
      screen.getByLabelText(/Précisez le document demandé/),
    ).toBeInTheDocument();

    await user.click(await findTypeCard(/Certificat de baptême/));
    expect(
      screen.queryByLabelText(/Précisez le document demandé/),
    ).not.toBeInTheDocument();
  });

  // ── Stepper + navigation avant / arrière ───────────────────────────────────

  test('parcourt les 4 étapes nommées puis revient en arrière', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    // 1 — Document
    expect(
      screen.getByRole('heading', { name: 'Quel document ?' }),
    ).toBeInTheDocument();
    await completeDocumentStep(user);

    // 2 — Paroisse
    expect(
      screen.getByRole('heading', { name: 'Quelle paroisse ?' }),
    ).toBeInTheDocument();
    await completeParishStep(user);

    // 3 — Détails
    expect(
      screen.getByRole('heading', { name: 'Vos informations' }),
    ).toBeInTheDocument();
    await completeDetailsStep(user);

    // 4 — Validation
    expect(
      screen.getByRole('heading', { name: 'Récapitulatif' }),
    ).toBeInTheDocument();

    // Retour arrière via le bouton d'en-tête → étape 3.
    await user.click(screen.getByRole('button', { name: 'Étape précédente' }));
    expect(
      await screen.findByRole('heading', { name: 'Vos informations' }),
    ).toBeInTheDocument();

    // Retour arrière via le stepper → étape 1.
    await user.click(
      screen.getByRole('button', {
        name: "Revenir à l'étape 1 sur 4 : Document",
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Quel document ?' }),
    ).toBeInTheDocument();
  });

  test('le stepper n’expose pas d’étape à venir comme cliquable', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    // Sur l'étape 1, aucune étape n'est franchie → aucun retour possible.
    expect(
      screen.queryByRole('button', { name: /Revenir à l'étape/ }),
    ).not.toBeInTheDocument();

    await completeDocumentStep(user);

    // Sur l'étape 2 : seule l'étape 1 est un bouton de retour.
    expect(
      screen.getAllByRole('button', { name: /Revenir à l'étape/ }),
    ).toHaveLength(1);
  });

  // ── Étape 2 — Paroisse ─────────────────────────────────────────────────────

  test('l’étape Paroisse propose les paroisses d’appartenance en tête', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await completeDocumentStep(user);

    expect(await screen.findByText('Mes paroisses')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Saint-Pierre/ }),
    ).toBeInTheDocument();
    // …et plus aucun champ texte libre "Diocèse".
    expect(
      screen.queryByPlaceholderText(/Diocèse de Dakar/),
    ).not.toBeInTheDocument();
  });

  test('permet la recherche libre d’une autre paroisse du registre', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/org/parishes/`, () =>
        HttpResponse.json({
          results: [
            {
              id: 99,
              name: 'Cathédrale',
              city: 'Kaolack',
              address: '',
              diocese: 9,
              diocese_name: 'Diocèse de Kaolack',
            },
          ],
        }),
      ),
    );

    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await completeDocumentStep(user);

    await user.type(screen.getByLabelText(/rechercher une paroisse/i), 'Cath');
    await user.click(await screen.findByRole('button', { name: /Cathédrale/ }));

    // État sélectionné : paroisse affichée + bouton "Changer".
    expect(screen.getByText('Cathédrale')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /changer/i }),
    ).toBeInTheDocument();
  });

  test('impossible d’avancer depuis l’étape Paroisse sans sélection', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await completeDocumentStep(user);

    await user.click(screen.getByRole('button', { name: /continuer/i }));

    expect(await screen.findByText('Paroisse requise')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Quelle paroisse ?' }),
    ).toBeInTheDocument();
  });

  // ── Étape 3 — Détails ──────────────────────────────────────────────────────

  test('regroupe identité, sacrement, contact et pièce jointe en sous-sections', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await completeDocumentStep(user);
    await completeParishStep(user);

    // Les 4 sous-sections d'un même écran défilant (fieldset/legend).
    expect(
      screen.getByRole('group', { name: 'Identité du demandeur' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Le sacrement à retrouver' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Contact' })).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: 'Pièce jointe (optionnel)' }),
    ).toBeInTheDocument();
  });

  test('impossible d’avancer depuis l’étape Détails si elle est invalide', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await completeDocumentStep(user);
    await completeParishStep(user);

    // Champs vidés → l'étape reste bloquée.
    await user.clear(screen.getByLabelText(/prénom/i));
    await user.clear(screen.getByLabelText(/^nom \*/i));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    expect(await screen.findByText('Prénom(s) requis')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Vos informations' }),
    ).toBeInTheDocument();
  });

  // ── Étape 4 — Validation ───────────────────────────────────────────────────

  test('le récapitulatif affiche les valeurs saisies, par section', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);

    const documentSection = screen
      .getByRole('heading', { name: 'Document' })
      .closest('div')?.parentElement as HTMLElement;
    expect(
      within(documentSection).getByText('Certificat de baptême'),
    ).toBeInTheDocument();
    expect(
      within(documentSection).getByText('Usage personnel'),
    ).toBeInTheDocument();

    // Paroisse du registre + diocèse déduit.
    expect(screen.getByText('Saint-Pierre')).toBeInTheDocument();
    expect(screen.getByText('Diocèse de Dakar (déduit)')).toBeInTheDocument();

    // Détails : identité, naissance, parents, sacrement, contact, pièce jointe.
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('01/01/2000 · Dakar')).toBeInTheDocument();
    expect(screen.getByText('Dupont · Martin')).toBeInTheDocument();
    expect(screen.getByText('≈ 2000 · Dakar')).toBeInTheDocument();
    expect(screen.getByText('+221770000000')).toBeInTheDocument();
    expect(screen.getByText('jean@example.com')).toBeInTheDocument();
    expect(screen.getByText('Aucune')).toBeInTheDocument();
  });

  test('« Modifier » de la section Document renvoie à l’étape 1', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);

    await user.click(
      screen.getByRole('button', { name: 'Modifier la section Document' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Quel document ?' }),
    ).toBeInTheDocument();
  });

  test('« Modifier » de la section Paroisse renvoie à l’étape 2', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);

    await user.click(
      screen.getByRole('button', {
        name: 'Modifier la section Paroisse du registre',
      }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Quelle paroisse ?' }),
    ).toBeInTheDocument();
  });

  test('« Modifier » de la section Détails renvoie à l’étape 3', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);

    await user.click(
      screen.getByRole('button', { name: 'Modifier la section Détails' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Vos informations' }),
    ).toBeInTheDocument();
  });

  test('la saisie est conservée en revenant au récapitulatif après « Modifier »', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);

    await user.click(
      screen.getByRole('button', { name: 'Modifier la section Détails' }),
    );
    await screen.findByRole('heading', { name: 'Vos informations' });
    expect(screen.getByLabelText(/prénom/i)).toHaveValue('Jean');

    await user.click(screen.getByRole('button', { name: /continuer/i }));

    expect(
      await screen.findByRole('heading', { name: 'Récapitulatif' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
  });

  test('"Envoyer la demande" apparaît à la dernière étape, désactivé avant consentement', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);

    const submitBtn = screen.getByRole('button', {
      name: /envoyer la demande/i,
    });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  test('le consentement active "Envoyer la demande"', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);

    await user.click(screen.getByRole('button', { name: /je certifie/i }));

    expect(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    ).toBeEnabled();
  });

  // ── Soumission — le payload NE CHANGE PAS ──────────────────────────────────

  test('soumet EXACTEMENT le même payload CreateDocumentInput qu’avant la refonte', async () => {
    const capturedBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        async ({ request }) => {
          capturedBodies.push(
            (await request.json()) as Record<string, unknown>,
          );
          return HttpResponse.json(
            createDocumentRequest({
              document_type: 'baptism',
              status: 'submitted',
            }),
            { status: 201 },
          );
        },
      ),
    );

    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await waitFor(() => expect(capturedBodies).toHaveLength(1));

    // Contrat figé : mêmes clés, mêmes valeurs, aucun champ ajouté ni retiré.
    // (`reason_free`, `additional_info` et `document_details` valent `undefined`
    // ici et sont donc absents du JSON — comportement inchangé.)
    expect(capturedBodies[0]).toEqual({
      document_type: 'baptism',
      reason: 'personal',
      requester_last_name: 'Dupont',
      requester_first_names: 'Jean',
      date_of_birth: '2000-01-01',
      place_of_birth: 'Dakar',
      contact_phone: '+221770000000',
      contact_email: 'jean@example.com',
      father_last_name: 'Dupont',
      mother_last_name: 'Martin',
      parish_id: 11,
      sacrament_approximate_date: '2000',
      sacrament_location: 'Dakar',
      attachment_file_id: null,
      consent_given: true,
    });
    // B5c : plus de texte libre parish_name/diocese dans le payload (FK seule).
    expect(capturedBodies[0]).not.toHaveProperty('parish_name');
    expect(capturedBodies[0]).not.toHaveProperty('diocese');
  });

  test('feedback succès + redirection vers le SUIVI de la demande créée', async () => {
    // Le handler partagé POST /v1/documents/requests/ répond avec id "99".
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    // Notification de succès…
    await screen.findByText('Demande envoyée');
    // …et redirection vers la page de détail/suivi de la demande créée.
    await waitFor(() =>
      expect(mockRouterPush).toHaveBeenCalledWith('/app/documents/99'),
    );
  });

  test('affiche un indicateur de chargement pendant la soumission', async () => {
    let resolveRequest!: () => void;
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = () =>
              resolve(
                HttpResponse.json(
                  createDocumentRequest({
                    document_type: 'baptism',
                    status: 'submitted',
                  }),
                  { status: 201 },
                ),
              );
          }),
      ),
    );

    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await navigateToReview(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await screen.findByText(/envoi en cours/i);
    expect(
      screen.getByRole('button', { name: /envoi en cours/i }),
    ).toBeDisabled();

    resolveRequest();
  });

  // ── Garde de sortie ────────────────────────────────────────────────────────

  test('quitter un formulaire vierge ne demande aucune confirmation', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(
      screen.getByRole('button', { name: 'Quitter la demande' }),
    );

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  test('quitter avec des données saisies demande confirmation', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(await findTypeCard(/Certificat de baptême/));
    await user.click(
      screen.getByRole('button', { name: 'Quitter la demande' }),
    );

    // Le tunnel n'est pas quitté tant que la sortie n'est pas confirmée.
    expect(
      await screen.findByRole('alertdialog', { name: 'Quitter la demande ?' }),
    ).toBeInTheDocument();
    expect(mockRouterBack).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: 'Quitter sans enregistrer' }),
    );

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
  });

  test('la garde de sortie peut être annulée sans perdre la saisie', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(await findTypeCard(/Certificat de baptême/));
    await user.click(
      screen.getByRole('button', { name: 'Quitter la demande' }),
    );
    await screen.findByRole('alertdialog');

    await user.click(
      screen.getByRole('button', { name: 'Continuer ma demande' }),
    );

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(mockRouterBack).not.toHaveBeenCalled();
    // La sélection est conservée.
    expect(
      screen.getByRole('button', { name: /Certificat de baptême/ }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
