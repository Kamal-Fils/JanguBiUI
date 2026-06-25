import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createMessage } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ChatWindow } from '../chat-window';

const CONVERSATION_ID = 'conv-1';

describe('ChatWindow', () => {
  test('shows loading spinner while fetching messages', async () => {
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        async () => {
          await delay(Infinity);
          return HttpResponse.json({ count: 0, results: [] });
        },
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeNull();
    });
  });

  test('displays messages after loading', async () => {
    const messages = [
      createMessage({
        id: 'msg-1',
        content: 'Bonjour Père Jean.',
        is_mine: true,
      }),
      createMessage({
        id: 'msg-2',
        content: 'Bonjour, comment puis-je vous aider ?',
        is_mine: false,
      }),
    ];
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json({ count: messages.length, results: messages }),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    await screen.findByText('Bonjour Père Jean.');
    expect(
      screen.getByText('Bonjour, comment puis-je vous aider ?'),
    ).toBeInTheDocument();
  });

  test('displays messages when backend returns a flat array (real format)', async () => {
    const messages = [
      createMessage({
        id: 'flat-1',
        content: 'Message depuis tableau plat.',
        is_mine: false,
      }),
      createMessage({
        id: 'flat-2',
        content: 'Deuxième message.',
        is_mine: true,
      }),
    ];
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json(messages),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    await screen.findByText('Message depuis tableau plat.');
    expect(screen.getByText('Deuxième message.')).toBeInTheDocument();
    expect(
      screen.queryByText(/commencez la conversation/i),
    ).not.toBeInTheDocument();
  });

  test('shows empty state when there are no messages', async () => {
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    await screen.findByText(/commencez la conversation/i);
  });

  test('textarea accepts user input', async () => {
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    const textarea = screen.getByPlaceholderText(/votre message/i);
    await userEvent.type(textarea, 'Hello world');
    expect(textarea).toHaveValue('Hello world');
  });

  test('sends message on send button click', async () => {
    const capturedBodies: unknown[] = [];
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/send/`,
        async ({ request }) => {
          const body = await request.json();
          capturedBodies.push(body);
          return HttpResponse.json(
            createMessage({ content: 'Bonjour !', is_mine: true }),
            { status: 201 },
          );
        },
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    const textarea = screen.getByPlaceholderText(/votre message/i);
    await userEvent.type(textarea, 'Bonjour !');
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }));

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).toEqual({ content: 'Bonjour !' });
  });

  test('sends message on Enter key press (without Shift)', async () => {
    const capturedBodies: unknown[] = [];
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/send/`,
        async ({ request }) => {
          const body = await request.json();
          capturedBodies.push(body);
          return HttpResponse.json(
            createMessage({ content: 'Test message', is_mine: true }),
            { status: 201 },
          );
        },
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    const textarea = screen.getByPlaceholderText(/votre message/i);
    await userEvent.type(textarea, 'Test message');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).toEqual({ content: 'Test message' });
  });

  test('clears textarea after sending message', async () => {
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/send/`,
        async () =>
          HttpResponse.json(
            createMessage({ content: 'Bonjour !', is_mine: true }),
            { status: 201 },
          ),
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    const textarea = screen.getByPlaceholderText(/votre message/i);
    await userEvent.type(textarea, 'Bonjour !');
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }));

    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  test('shows the CGU acceptance panel when messages return 403, then loads messages after accepting', async () => {
    let cguAccepted = false;
    let cguPosted = false;
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => {
          if (!cguAccepted) {
            return HttpResponse.json(
              {
                detail:
                  'Vous devez accepter les CGU de messagerie pour accéder aux messages.',
              },
              { status: 403 },
            );
          }
          return HttpResponse.json({
            count: 1,
            results: [
              createMessage({
                id: 'after-cgu',
                content: 'Bienvenue dans la conversation.',
                is_mine: false,
              }),
            ],
          });
        },
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/cgu/`,
        () => {
          cguPosted = true;
          cguAccepted = true;
          return HttpResponse.json({});
        },
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    await screen.findByText(/accepter les cgu de messagerie/i);

    await userEvent.click(
      screen.getByRole('button', { name: /accepter les cgu/i }),
    );

    await waitFor(() => expect(cguPosted).toBe(true));
    await screen.findByText('Bienvenue dans la conversation.');
    // Le panneau a disparu : on cible le BOUTON du panneau (le toast 403 de
    // l'intercepteur contient le même texte mais n'a pas de bouton).
    expect(
      screen.queryByRole('button', { name: /accepter les cgu/i }),
    ).not.toBeInTheDocument();
  });

  test('shows a generic error state when messages fail to load (non-403)', async () => {
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json({ detail: 'Boom' }, { status: 500 }),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    await screen.findByText(/impossible d’ouvrir la conversation/i);
    expect(
      screen.queryByText(/accepter les cgu de messagerie/i),
    ).not.toBeInTheDocument();
  });

  test('send button is disabled when textarea is empty', () => {
    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json({ count: 0, results: [] }),
      ),
      http.post(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/read/`,
        () => HttpResponse.json({}),
      ),
    );

    renderApp(
      <ChatWindow
        conversationId={CONVERSATION_ID}
        participantName="Père Jean"
      />,
    );

    expect(screen.getByRole('button', { name: /envoyer/i })).toBeDisabled();
  });
});
