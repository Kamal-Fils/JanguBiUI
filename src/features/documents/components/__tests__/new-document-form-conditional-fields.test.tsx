import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { createDocumentRequest, createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { NewDocumentForm } from '../new-document-form';

/**
 * Filet de sécurité posé AVANT le découpage de `new-document-form.tsx`.
 *
 * La suite historique (`new-document-form.test.tsx`) couvre le parcours nominal
 * baptême/usage personnel. Elle laisse hors périmètre exactement ce que le
 * découpage risque de casser en silence : les champs qui n'apparaissent que
 * pour certains types (mariage religieux, parrain/marraine), les précisions
 * libres « Autre » jusque dans le payload, et la pièce jointe. Ces tests
 * verrouillent ces chemins-là ; ils doivent rester verts à l'identique.
 */

const mockRouterPush = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  push: mockRouterPush,
  back: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
} as never);

const MEMBERSHIPS = [
  {
    id: 1,
    church: { id: 111, name: 'Église A' },
    parish: { id: 11, name: 'Saint-Pierre' },
    diocese: { id: 1, name: 'Diocèse de Dakar' },
    is_primary: true,
  },
];

/** Référentiel réduit aux types exercés ici (cf. `apps/documents/constants.py`). */
const UNIVERSAL = ['parish_file', 'personal', 'other'];

const DOCUMENT_OPTIONS = {
  document_types: [
    {
      value: 'baptism',
      label: 'Certificat de baptême',
      requires_precision: false,
      allowed_reasons: ['godparent', ...UNIVERSAL],
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
      allowed_reasons: UNIVERSAL,
    },
  ],
  reasons: [
    { value: 'godparent', label: 'Parrain / marraine' },
    { value: 'parish_file', label: 'Dossier paroissial' },
    { value: 'personal', label: 'Usage personnel' },
    { value: 'other', label: 'Autre' },
  ],
};

type User = ReturnType<typeof userEvent.setup>;

function setupUser(): User {
  return userEvent.setup({ delay: null });
}

async function fill(user: User, field: HTMLElement, value: string) {
  await user.clear(field);
  await user.type(field, value);
}

/** Capture le corps du POST de création et renvoie le tableau alimenté. */
function captureCreateBodies(): Array<Record<string, unknown>> {
  const bodies: Array<Record<string, unknown>> = [];
  server.use(
    http.post(`${env.API_URL}/v1/documents/requests/`, async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(
        createDocumentRequest({ document_type: 'baptism' }),
        { status: 201 },
      );
    }),
  );
  return bodies;
}

/** Étape 1 : choisit un type par son libellé, puis « Usage personnel ». */
async function completeDocumentStep(user: User, typeLabel: RegExp) {
  await user.click(await screen.findByRole('button', { name: typeLabel }));
  await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
  await user.click(screen.getByRole('button', { name: /continuer/i }));
  await screen.findByRole('heading', { name: 'Quelle paroisse ?' });
}

/** Étape 2 : paroisse d'appartenance. */
async function completeParishStep(user: User) {
  await user.click(await screen.findByRole('button', { name: /Saint-Pierre/ }));
  await user.click(screen.getByRole('button', { name: /continuer/i }));
  await screen.findByRole('heading', { name: 'Vos informations' });
}

/** Étape 3 : uniquement les champs communs (les conditionnels restent au test). */
async function fillCommonDetails(user: User) {
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
}

async function goToReview(user: User) {
  await user.click(screen.getByRole('button', { name: /continuer/i }));
  await screen.findByRole('heading', { name: 'Récapitulatif' });
}

async function consentAndSubmit(user: User) {
  await user.click(screen.getByRole('button', { name: /je certifie/i }));
  await user.click(screen.getByRole('button', { name: /envoyer la demande/i }));
}

describe('NewDocumentForm — champs conditionnels et précisions libres', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    server.use(
      http.get(`${env.API_URL}/v1/auth/me/`, () =>
        HttpResponse.json(createUser({ memberships: MEMBERSHIPS })),
      ),
      http.get(`${env.API_URL}/v1/documents/requests/options/`, () =>
        HttpResponse.json(DOCUMENT_OPTIONS),
      ),
    );
  });

  // ── Mariage religieux : noms des deux époux ────────────────────────────────

  test('les champs époux/épouse n’apparaissent que pour le mariage religieux', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await completeDocumentStep(user, /Certificat de baptême/);
    await completeParishStep(user);

    expect(
      screen.queryByLabelText(/nom complet de l'époux/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/nom complet de l'épouse/i),
    ).not.toBeInTheDocument();
  });

  test('le mariage religieux exige les noms complets des deux époux', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await completeDocumentStep(user, /Attestation de mariage religieux/);
    await completeParishStep(user);
    await fillCommonDetails(user);

    // Les deux champs sont bien affichés pour ce type…
    expect(
      screen.getByLabelText(/nom complet de l'époux/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/nom complet de l'épouse/i),
    ).toBeInTheDocument();

    // …et laissés vides, ils bloquent l'étape.
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    expect(
      await screen.findByText("Nom complet de l'époux requis"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nom complet de l'épouse requis"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Vos informations' }),
    ).toBeInTheDocument();
  });

  test('les noms des époux sont récapitulés puis envoyés dans document_details', async () => {
    const bodies = captureCreateBodies();
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await completeDocumentStep(user, /Attestation de mariage religieux/);
    await completeParishStep(user);
    await fillCommonDetails(user);
    await fill(
      user,
      screen.getByLabelText(/nom complet de l'époux/i),
      'Paul Diop',
    );
    await fill(
      user,
      screen.getByLabelText(/nom complet de l'épouse/i),
      'Marie Faye',
    );
    await goToReview(user);

    expect(screen.getByText('Paul Diop · Marie Faye')).toBeInTheDocument();

    await consentAndSubmit(user);
    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0].document_details).toEqual({
      spouse_full_name_groom: 'Paul Diop',
      spouse_full_name_bride: 'Marie Faye',
    });
  });

  // ── Parrain / marraine : type de célébration ───────────────────────────────

  test('le type parrain/marraine exige le type de célébration', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await completeDocumentStep(user, /Attestation parrain \/ marraine/);
    await completeParishStep(user);
    await fillCommonDetails(user);

    expect(screen.getByLabelText(/type de célébration/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /continuer/i }));

    expect(
      await screen.findByText('Type de célébration requis'),
    ).toBeInTheDocument();
  });

  test('le type de célébration est récapitulé puis envoyé dans document_details', async () => {
    const bodies = captureCreateBodies();
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await completeDocumentStep(user, /Attestation parrain \/ marraine/);
    await completeParishStep(user);
    await fillCommonDetails(user);
    await fill(user, screen.getByLabelText(/type de célébration/i), 'Baptême');
    await goToReview(user);

    expect(screen.getByText('Baptême')).toBeInTheDocument();

    await consentAndSubmit(user);
    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0].document_details).toEqual({ celebration_type: 'Baptême' });
  });

  // ── Précisions libres « Autre » jusqu'au payload ───────────────────────────

  test('les précisions « Autre » sont récapitulées puis envoyées, espaces retirés', async () => {
    const bodies = captureCreateBodies();
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await user.click(
      await screen.findByRole('button', { name: /Autre document/ }),
    );
    await fill(
      user,
      screen.getByLabelText(/Précisez le document demandé/),
      '  Certificat de profession religieuse  ',
    );
    await user.click(screen.getByRole('button', { name: 'Autre' }));
    await fill(
      user,
      screen.getByLabelText(/Précisez le motif/),
      '  Dossier de naturalisation  ',
    );
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await screen.findByRole('heading', { name: 'Quelle paroisse ?' });

    await completeParishStep(user);
    await fillCommonDetails(user);
    await goToReview(user);

    // Le récapitulatif affiche la saisie telle quelle (le trim est au payload).
    expect(
      screen.getByText('Certificat de profession religieuse', { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Dossier de naturalisation', { exact: false }),
    ).toBeInTheDocument();

    await consentAndSubmit(user);
    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0].document_type).toBe('other');
    expect(bodies[0].document_type_free).toBe(
      'Certificat de profession religieuse',
    );
    expect(bodies[0].reason).toBe('other');
    expect(bodies[0].reason_free).toBe('Dossier de naturalisation');
  });

  test('une précision saisie puis abandonnée ne part pas dans le payload', async () => {
    const bodies = captureCreateBodies();
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    // On saisit une précision pour « Autre document »…
    await user.click(
      await screen.findByRole('button', { name: /Autre document/ }),
    );
    await fill(
      user,
      screen.getByLabelText(/Précisez le document demandé/),
      'Certificat de profession religieuse',
    );
    // …puis on change d'avis pour un type standard.
    await user.click(
      screen.getByRole('button', { name: /Certificat de baptême/ }),
    );
    await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await screen.findByRole('heading', { name: 'Quelle paroisse ?' });

    await completeParishStep(user);
    await fillCommonDetails(user);
    await goToReview(user);
    await consentAndSubmit(user);
    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0].document_type).toBe('baptism');
    expect(bodies[0]).not.toHaveProperty('document_type_free');
  });

  // ── Informations complémentaires (optionnel) ───────────────────────────────

  test('les informations complémentaires sont récapitulées puis envoyées', async () => {
    const bodies = captureCreateBodies();
    const user = setupUser();
    renderApp(<NewDocumentForm />);

    await completeDocumentStep(user, /Certificat de baptême/);
    await completeParishStep(user);
    await fillCommonDetails(user);
    await fill(
      user,
      screen.getByLabelText(/informations complémentaires/i),
      'Baptisé pendant la vigile pascale',
    );
    await goToReview(user);

    expect(
      screen.getByText('Baptisé pendant la vigile pascale'),
    ).toBeInTheDocument();

    await consentAndSubmit(user);
    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0].additional_info).toBe('Baptisé pendant la vigile pascale');
  });
});
