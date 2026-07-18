import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, userEvent } from '@/testing/test-utils';

import { AssistantChat } from '../assistant-chat';

const RAG_URL = `${env.API_URL}/v1/rag/query/`;

describe('AssistantChat', () => {
  test('sending a question displays the user bubble then the assistant answer', async () => {
    server.use(
      http.post(RAG_URL, async ({ request }) => {
        const body = (await request.json()) as { query: string };
        return HttpResponse.json({
          answer: `Réponse à : ${body.query}`,
          context: '',
          intent: { module: 'bible' },
        });
      }),
    );

    renderApp(<AssistantChat />);

    await userEvent.type(
      screen.getByLabelText('Votre message'),
      'Qui est Marie ?',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /envoyer le message/i }),
    );

    // Bulle utilisateur immédiate, puis réponse de l'assistant.
    expect(await screen.findByText('Qui est Marie ?')).toBeInTheDocument();
    expect(
      await screen.findByText('Réponse à : Qui est Marie ?'),
    ).toBeInTheDocument();
    // Le badge d'intention accompagne la réponse.
    expect(screen.getByText('Bible')).toBeInTheDocument();
  });

  test('clicking a welcome suggestion sends the suggestion as a question', async () => {
    server.use(
      http.post(RAG_URL, () =>
        HttpResponse.json({
          answer: 'Voici les lectures du jour.',
          context: '',
          intent: {},
        }),
      ),
    );

    renderApp(<AssistantChat />);

    await userEvent.click(
      screen.getByRole('button', { name: /évangile du jour/i }),
    );

    expect(
      await screen.findByText('Quelles sont les lectures du jour ?'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Voici les lectures du jour.'),
    ).toBeInTheDocument();
  });

  test('shows an error bubble on failure and retry replays the same question', async () => {
    let calls = 0;
    server.use(
      http.post(RAG_URL, () => {
        calls += 1;
        if (calls === 1) {
          return HttpResponse.json(
            { detail: 'Erreur interne' },
            { status: 500 },
          );
        }
        return HttpResponse.json({
          answer: 'Réponse après relance.',
          context: '',
          intent: {},
        });
      }),
    );

    renderApp(<AssistantChat />);

    await userEvent.type(
      screen.getByLabelText('Votre message'),
      'Question fragile',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /envoyer le message/i }),
    );

    // Message d'erreur avec action de relance.
    expect(
      await screen.findByText(/je n'ai pas pu générer de réponse/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /réessayer/i }));

    // La relance remplace le message d'erreur par la vraie réponse,
    // sans dupliquer la bulle utilisateur.
    expect(
      await screen.findByText('Réponse après relance.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/je n'ai pas pu générer de réponse/i),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('Question fragile')).toHaveLength(1);
    expect(calls).toBe(2);
  });
});
