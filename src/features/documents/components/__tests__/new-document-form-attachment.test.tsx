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
 * La pièce jointe n'était couverte par aucun test : ni la limite de taille, ni
 * le téléversement, ni le lien entre l'identifiant de fichier obtenu et le
 * payload final. C'est pourtant le bloc le plus autonome du formulaire, donc
 * le premier candidat à l'extraction — et celui dont la régression passerait
 * le plus facilement inaperçue.
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

const DOCUMENT_OPTIONS = {
  document_types: [
    {
      value: 'baptism',
      label: 'Certificat de baptême',
      requires_precision: false,
      allowed_reasons: ['personal'],
    },
  ],
  reasons: [{ value: 'personal', label: 'Usage personnel' }],
};

type User = ReturnType<typeof userEvent.setup>;

function setupUser(): User {
  return userEvent.setup({ delay: null });
}

async function fill(user: User, field: HTMLElement, value: string) {
  await user.clear(field);
  await user.type(field, value);
}

/** Fichier léger dont on force la taille déclarée (pas d'allocation réelle). */
function makeFile(name: string, sizeBytes: number): File {
  const file = new File(['x'], name, { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

/** Amène le formulaire à l'étape 3, où vit la pièce jointe. */
async function goToDetailsStep(user: User) {
  await user.click(
    await screen.findByRole('button', { name: /Certificat de baptême/ }),
  );
  await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
  await user.click(screen.getByRole('button', { name: /continuer/i }));

  await user.click(await screen.findByRole('button', { name: /Saint-Pierre/ }));
  await user.click(screen.getByRole('button', { name: /continuer/i }));
  await screen.findByRole('heading', { name: 'Vos informations' });
}

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

function fileInput(): HTMLInputElement {
  return screen.getByLabelText(/sélectionner un fichier/i) as HTMLInputElement;
}

describe('NewDocumentForm — pièce jointe', () => {
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

  test('un fichier de plus de 10 Mo est refusé sans être téléversé', async () => {
    let uploadCalls = 0;
    server.use(
      http.post(`${env.API_URL}/v1/files/upload/standard/`, () => {
        uploadCalls += 1;
        return HttpResponse.json({ id: 42 }, { status: 201 });
      }),
    );

    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await goToDetailsStep(user);

    await user.upload(fileInput(), makeFile('gros.pdf', 11 * 1024 * 1024));

    expect(
      await screen.findByText(/dépasse la taille maximale de 10 Mo/i),
    ).toBeInTheDocument();
    // Le nom du fichier refusé n'est pas affiché, et rien n'est parti au serveur.
    expect(screen.queryByText('gros.pdf')).not.toBeInTheDocument();
    expect(uploadCalls).toBe(0);
    expect(
      screen.getByRole('button', { name: /choisir un fichier/i }),
    ).toBeInTheDocument();
  });

  test('un fichier valide est téléversé, affiché, puis lié à la demande', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        async ({ request }) => {
          bodies.push((await request.json()) as Record<string, unknown>);
          return HttpResponse.json(
            createDocumentRequest({ document_type: 'baptism' }),
            { status: 201 },
          );
        },
      ),
    );

    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await goToDetailsStep(user);
    await fillCommonDetails(user);

    await user.upload(fileInput(), makeFile('acte.pdf', 1024));

    expect(await screen.findByText('acte.pdf')).toBeInTheDocument();
    expect(
      await screen.findByText(/téléversé avec succès/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await screen.findByRole('heading', { name: 'Récapitulatif' });

    // Le récapitulatif nomme la pièce jointe au lieu de « Aucune ».
    expect(screen.getByText('acte.pdf')).toBeInTheDocument();
    expect(screen.queryByText('Aucune')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );
    await waitFor(() => expect(bodies).toHaveLength(1));

    // L'identifiant rendu par l'upload est celui envoyé avec la demande.
    expect(bodies[0].attachment_file_id).toBe(42);
  });

  test('retirer le fichier remet le champ à son état initial', async () => {
    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await goToDetailsStep(user);

    await user.upload(fileInput(), makeFile('acte.pdf', 1024));
    await screen.findByText('acte.pdf');

    await user.click(
      screen.getByRole('button', { name: /retirer le fichier/i }),
    );

    expect(screen.queryByText('acte.pdf')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /choisir un fichier/i }),
    ).toBeInTheDocument();
  });

  test('un échec de téléversement est signalé et ne bloque pas la demande', async () => {
    const bodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(`${env.API_URL}/v1/files/upload/standard/`, () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        async ({ request }) => {
          bodies.push((await request.json()) as Record<string, unknown>);
          return HttpResponse.json(
            createDocumentRequest({ document_type: 'baptism' }),
            { status: 201 },
          );
        },
      ),
    );

    const user = setupUser();
    renderApp(<NewDocumentForm />);
    await goToDetailsStep(user);
    await fillCommonDetails(user);

    await user.upload(fileInput(), makeFile('acte.pdf', 1024));

    expect(
      await screen.findByText(/échec du téléversement/i),
    ).toBeInTheDocument();
    // Le fichier est retiré : la demande reste envoyable, sans pièce jointe.
    expect(screen.queryByText('acte.pdf')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /continuer/i }));
    await screen.findByRole('heading', { name: 'Récapitulatif' });
    expect(screen.getByText('Aucune')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );
    await waitFor(() => expect(bodies).toHaveLength(1));

    expect(bodies[0].attachment_file_id).toBeNull();
  });
});
