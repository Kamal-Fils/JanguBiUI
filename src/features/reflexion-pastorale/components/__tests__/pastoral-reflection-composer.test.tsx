import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, userEvent } from '@/testing/test-utils';

import type { PastoralReflection } from '../../types';
import { PastoralReflectionComposer } from '../pastoral-reflection-composer';

const MY_TODAY_URL = `${env.API_URL}/v1/spiritual/reflections/my-today/`;
const CREATE_URL = `${env.API_URL}/v1/spiritual/reflections/`;

const existingReflection = {
  id: '4f2b7c9d-1a2b-4c3d-8e9f-0a1b2c3d4e5f',
  content: 'Aimez-vous les uns les autres.',
  author_name: 'Abbé Diouf',
  reflection_date: '2026-07-18',
  created_at: '2026-07-18T06:00:00Z',
  updated_at: '2026-07-18T06:00:00Z',
};

describe('PastoralReflectionComposer', () => {
  test('offers to write a reflection when none exists yet', async () => {
    server.use(http.get(MY_TODAY_URL, () => HttpResponse.json(null)));

    renderApp(<PastoralReflectionComposer />);

    expect(
      await screen.findByRole('button', { name: /rédiger/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/partagez une réflexion liée aux lectures du jour/i),
    ).toBeInTheDocument();
  });

  test('shows the existing reflection with a modify action', async () => {
    server.use(
      http.get(MY_TODAY_URL, () => HttpResponse.json(existingReflection)),
    );

    renderApp(<PastoralReflectionComposer />);

    expect(
      await screen.findByText(/aimez-vous les uns les autres/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /modifier/i }),
    ).toBeInTheDocument();
  });

  test('writing and publishing a reflection shows it as published', async () => {
    let saved: PastoralReflection | null = null;
    server.use(
      http.get(MY_TODAY_URL, () =>
        saved ? HttpResponse.json(saved) : HttpResponse.json(null),
      ),
      http.post(CREATE_URL, async ({ request }) => {
        const body = (await request.json()) as { content: string };
        saved = { ...existingReflection, content: body.content };
        return HttpResponse.json(saved, { status: 201 });
      }),
    );

    renderApp(<PastoralReflectionComposer />);

    await userEvent.click(
      await screen.findByRole('button', { name: /rédiger/i }),
    );
    await userEvent.type(
      screen.getByLabelText(/votre réflexion pastorale/i),
      'Que votre lumière brille.',
    );
    await userEvent.click(screen.getByRole('button', { name: /publier/i }));

    expect(
      await screen.findByText(/que votre lumière brille/i),
    ).toBeInTheDocument();
    expect(await screen.findByText(/réflexion publiée/i)).toBeInTheDocument();
  });

  test('shows an inline error when publishing fails', async () => {
    server.use(
      http.get(MY_TODAY_URL, () => HttpResponse.json(null)),
      http.post(CREATE_URL, () =>
        HttpResponse.json({ detail: 'Erreur serveur' }, { status: 500 }),
      ),
    );

    renderApp(<PastoralReflectionComposer />);

    await userEvent.click(
      await screen.findByRole('button', { name: /rédiger/i }),
    );
    await userEvent.type(
      screen.getByLabelText(/votre réflexion pastorale/i),
      'Tentative vouée à échouer',
    );
    await userEvent.click(screen.getByRole('button', { name: /publier/i }));

    expect(
      await screen.findByText(/impossible de publier la réflexion/i),
    ).toBeInTheDocument();
    // Le contenu saisi n'est pas perdu : l'édition reste ouverte.
    expect(screen.getByLabelText(/votre réflexion pastorale/i)).toHaveValue(
      'Tentative vouée à échouer',
    );
  });

  test('shows an error state with retry when loading fails', async () => {
    let calls = 0;
    server.use(
      http.get(MY_TODAY_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json({ detail: 'Erreur' }, { status: 500 });
        }
        return HttpResponse.json(existingReflection);
      }),
    );

    renderApp(<PastoralReflectionComposer />);

    expect(
      await screen.findByText(/impossible de charger votre réflexion/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    expect(
      await screen.findByText(/aimez-vous les uns les autres/i),
    ).toBeInTheDocument();
  });
});
