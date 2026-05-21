import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { createMessage } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';

import { getMessages, parseMessages } from '../get-messages';

const CONVERSATION_ID = 'conv-test';

describe('parseMessages', () => {
  test('handles a flat array response and computes is_mine from currentUserId', () => {
    const userId = 'user-me';
    const otherId = 'user-other';

    const raw = [
      createMessage({ id: 'm1', sender_id: userId, is_mine: false }),
      createMessage({ id: 'm2', sender_id: otherId, is_mine: true }),
    ];

    const result = parseMessages(raw, userId);

    expect(result.count).toBe(2);
    expect(result.results).toHaveLength(2);
    // parseMessages reverses order (backend newest-first → UI oldest-first)
    // so m2 (otherId) ends up at index 0, m1 (userId) at index 1
    expect(result.results[0].is_mine).toBe(false);
    expect(result.results[1].is_mine).toBe(true);
  });

  test('handles { count, results } paginated format', () => {
    const userId = 'user-me';
    const msg = createMessage({ id: 'm-x', sender_id: 'user-other' });

    const result = parseMessages({ count: 1, results: [msg] }, userId);

    expect(result.count).toBe(1);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe('m-x');
    expect(result.results[0].is_mine).toBe(false);
  });

  test('returns empty results when backend sends an empty flat array', () => {
    const result = parseMessages([]);
    expect(result.count).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  test('returns empty results when paginated response has no results key', () => {
    const result = parseMessages({ count: 0 });
    expect(result.count).toBe(0);
    expect(result.results).toHaveLength(0);
  });

  test('applies defaults to missing optional fields', () => {
    const minimal = {
      id: 'm1',
      content: 'Hello',
      sender_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
    };

    const result = parseMessages([minimal]);

    expect(result.count).toBe(1);
    const msg = result.results[0];
    expect(msg.content_type).toBe('text');
    expect(msg.is_deleted).toBe(false);
    expect(msg.reactions).toEqual([]);
    expect(msg.attachments).toEqual([]);
    expect(msg.is_mine).toBe(false);
  });

  test('keeps existing is_mine when no currentUserId is provided', () => {
    const result = parseMessages([
      createMessage({ id: 'm1', is_mine: true }),
      createMessage({ id: 'm2', is_mine: false }),
    ]);

    // parseMessages reverses order (backend newest-first → UI oldest-first)
    // so m2 (is_mine: false) ends up at index 0, m1 (is_mine: true) at index 1
    expect(result.results[0].is_mine).toBe(false);
    expect(result.results[1].is_mine).toBe(true);
  });
});

describe('getMessages (integration via MSW)', () => {
  test('fetches and parses a flat array response from the backend', async () => {
    const userId = 'user-me';
    const messages = [
      createMessage({ id: 'wire-1', sender_id: userId, content: 'Hi' }),
      createMessage({
        id: 'wire-2',
        sender_id: 'user-other',
        content: 'Bonjour',
      }),
    ];

    server.use(
      http.get(
        `${env.API_URL}/v1/messaging/conversations/${CONVERSATION_ID}/messages/`,
        () => HttpResponse.json(messages),
      ),
    );

    const result = await getMessages(CONVERSATION_ID, userId);

    expect(result.count).toBe(2);
    expect(result.results).toHaveLength(2);
    // parseMessages reverses order (backend newest-first → UI oldest-first)
    // wire-2 (user-other) ends up at index 0, wire-1 (userId) at index 1
    expect(result.results[0].is_mine).toBe(false);
    expect(result.results[1].is_mine).toBe(true);
  });
});
