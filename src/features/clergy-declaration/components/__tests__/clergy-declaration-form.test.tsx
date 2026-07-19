import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ClergyDeclarationForm } from '../clergy-declaration-form';

const UPLOAD_URL = `${env.API_URL}/v1/files/upload/standard/`;
const DECLARATION_URL = `${env.API_URL}/v1/users/me/clergy-declaration/`;
const PARISHES_URL = `${env.API_URL}/v1/org/parishes/`;

const createdDeclaration = {
  id: 1,
  claimed_pastoral_role: 'pretre',
  status: 'pending',
  parish_id: 42,
  parish_name: 'Paroisse Saint-Pierre',
  message: '',
  rejection_reason: '',
  justification_file_url: null,
  submitted_at: '2026-07-01T10:00:00Z',
  reviewed_at: null,
};

function mockParish() {
  server.use(
    http.get(PARISHES_URL, () =>
      HttpResponse.json({
        count: 1,
        results: [
          {
            id: 42,
            name: 'Paroisse Saint-Pierre',
            // `diocese` est la FK (un entier) côté contrat : un objet ici ferait
            // échouer le parse zod et le picker afficherait « aucune paroisse ».
            diocese: 3,
            diocese_name: 'Dakar',
            city: 'Dakar',
          },
        ],
      }),
    ),
  );
}

async function pickParish(user: ReturnType<typeof userEvent.setup>) {
  const search = screen.getByPlaceholderText(/rechercher/i);
  await user.type(search, 'Saint-Pierre');
  const option = await screen.findByRole('button', {
    name: /Paroisse Saint-Pierre/i,
  });
  await user.click(option);
}

describe('ClergyDeclarationForm — dépôt d’une auto-déclaration', () => {
  test('envoie exactement la charge utile attendue par le serveur', async () => {
    // Ce projet a déjà connu des pannes silencieuses dues à des payloads écrits
    // à la main (`message` pour `comment`, `file_id` omis). On vérifie donc les
    // noms de champs réellement transmis, pas seulement qu'un appel a eu lieu.
    let submitted: Record<string, unknown> = {};
    mockParish();
    server.use(
      http.post(UPLOAD_URL, () => HttpResponse.json({ id: 77 })),
      http.post(DECLARATION_URL, async ({ request }) => {
        submitted = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(createdDeclaration, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderApp(<ClergyDeclarationForm />);

    await user.selectOptions(screen.getByLabelText(/rôle exercé/i), 'pretre');

    await pickParish(user);

    await user.upload(
      screen.getByLabelText(/pièce justificative/i),
      new File(['attestation'], 'attestation.pdf', { type: 'application/pdf' }),
    );
    await screen.findByText(/joint à la demande/i);

    await user.click(screen.getByRole('button', { name: /envoyer ma demande/i }));

    await waitFor(() =>
      expect(submitted).toEqual({
        claimed_pastoral_role: 'pretre',
        parish_id: 42,
        justification_file_id: 77,
        message: '',
      }),
    );
  });

  test('sans justificatif ni paroisse, la demande n’est pas envoyée', async () => {
    let called = false;
    mockParish();
    server.use(
      http.post(DECLARATION_URL, () => {
        called = true;
        return HttpResponse.json(createdDeclaration, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderApp(<ClergyDeclarationForm />);

    await user.selectOptions(screen.getByLabelText(/rôle exercé/i), 'pretre');
    await user.click(screen.getByRole('button', { name: /envoyer ma demande/i }));

    expect(
      await screen.findByText(/choisissez votre paroisse de rattachement/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/joignez une pièce justificative/i),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  test('un rôle non choisi bloque l’envoi', async () => {
    let called = false;
    mockParish();
    server.use(
      http.post(DECLARATION_URL, () => {
        called = true;
        return HttpResponse.json(createdDeclaration, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderApp(<ClergyDeclarationForm />);

    await user.click(screen.getByRole('button', { name: /envoyer ma demande/i }));

    expect(
      await screen.findByText(/choisissez le rôle que vous exercez/i),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  test('un refus serveur est signalé à l’utilisateur', async () => {
    mockParish();
    server.use(
      http.post(UPLOAD_URL, () => HttpResponse.json({ id: 77 })),
      http.post(
        DECLARATION_URL,
        () =>
          new HttpResponse(
            JSON.stringify({ detail: 'Une demande est déjà en cours d’examen.' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          ),
      ),
    );

    const user = userEvent.setup();
    renderApp(<ClergyDeclarationForm />);

    await user.selectOptions(screen.getByLabelText(/rôle exercé/i), 'pretre');
    await pickParish(user);
    await user.upload(
      screen.getByLabelText(/pièce justificative/i),
      new File(['x'], 'x.pdf', { type: 'application/pdf' }),
    );
    await screen.findByText(/joint à la demande/i);

    await user.click(screen.getByRole('button', { name: /envoyer ma demande/i }));

    expect(await screen.findByText(/envoi impossible/i)).toBeInTheDocument();
  });
});
