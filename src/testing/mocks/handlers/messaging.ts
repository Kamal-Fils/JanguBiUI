import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import { createConversation, createMessage } from '@/testing/data-generators';

const mockConversations = [
  createConversation({
    id: 'conv-1',
    participant_a: {
      id: 'user-priest',
      email: 'jean@eglise.sn',
      full_name: 'Père Jean',
    },
    unread_count: 3,
    last_message: {
      id: 'lm-1',
      content: 'Merci pour votre message.',
      sent_at: new Date().toISOString(),
    },
  }),
  createConversation({
    id: 'conv-2',
    participant_a: {
      id: 'user-sister',
      email: 'marie@eglise.sn',
      full_name: 'Soeur Marie',
    },
    unread_count: 0,
    last_message: {
      id: 'lm-2',
      content: 'Nous vous attendons dimanche.',
      sent_at: new Date().toISOString(),
    },
  }),
];

const mockMessages: Record<string, ReturnType<typeof createMessage>[]> = {
  'conv-1': [
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
  ],
  'conv-2': [
    createMessage({
      id: 'msg-3',
      content: 'Nous vous attendons dimanche.',
      is_mine: false,
    }),
  ],
};

export const messagingHandlers = [
  // Backend returns a flat array, not { count, results }
  http.get(`${env.API_URL}/v1/messaging/conversations/`, () => {
    return HttpResponse.json(mockConversations);
  }),

  http.get(
    `${env.API_URL}/v1/messaging/conversations/:id/`,
    ({ params }) => {
      const id = String(params.id);
      const conv = mockConversations.find((c) => c.id === id);
      if (!conv) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(conv);
    },
  ),

  http.post(
    `${env.API_URL}/v1/messaging/conversations/create/`,
    async ({ request }) => {
      const body = (await request.json()) as { priest_user_id: string };
      const created = createConversation({
        id: 'conv-new',
        participant_b: {
          id: body.priest_user_id ?? 'user-new',
          email: 'nouveau@contact.sn',
          full_name: 'Nouveau contact',
        },
      });
      return HttpResponse.json(created, { status: 201 });
    },
  ),

  // Backend returns a flat array (not { count, results })
  http.get(
    `${env.API_URL}/v1/messaging/conversations/:id/messages/`,
    ({ params }) => {
      const id = String(params.id);
      const messages = mockMessages[id] ?? [];
      return HttpResponse.json(messages);
    },
  ),

  http.post(
    `${env.API_URL}/v1/messaging/conversations/:id/messages/send/`,
    async ({ params, request }) => {
      const id = String(params.id);
      const body = (await request.json()) as { content: string };
      const newMsg = createMessage({
        id: `msg-new-${Date.now()}`,
        content: body.content,
        is_mine: true,
      });
      if (mockMessages[id]) {
        mockMessages[id].push(newMsg);
      }
      return HttpResponse.json(newMsg, { status: 201 });
    },
  ),

  http.post(`${env.API_URL}/v1/messaging/conversations/:id/read/`, () => {
    return HttpResponse.json({ detail: 'Marqué comme lu.' });
  }),
];
