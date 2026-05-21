import { expect, test } from '@playwright/test';

/**
 * Messaging — conversation list and new-conversation flow.
 *
 * API responses are mocked so the tests work without a live backend.
 */

const EMPTY_CONVERSATIONS_RESPONSE = JSON.stringify({
  count: 0,
  results: [],
});

const CONVERSATIONS_WITH_DATA = JSON.stringify({
  count: 1,
  results: [
    {
      id: 'conv-1',
      participant_a: {
        id: 'user-a',
        email: 'jean@exemple.com',
        full_name: 'Jean Dupont',
      },
      participant_b: {
        id: 'user-b',
        email: 'marie@exemple.com',
        full_name: 'Marie Sow',
      },
      last_message: {
        content: 'Bonjour Marie !',
        sent_at: new Date().toISOString(),
      },
      last_message_at: new Date().toISOString(),
      unread_count: 2,
    },
  ],
});

// ── Messages list — empty state ───────────────────────────────────────────────

test.describe('Messages — liste vide', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/messaging/conversations/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: EMPTY_CONVERSATIONS_RESPONSE,
      }),
    );
    await page.goto('/app/messages');
  });

  test('page renders "Messages" as heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /messages/i }),
    ).toBeVisible();
  });

  test('subtitle "Vos conversations" is visible', async ({ page }) => {
    await expect(page.getByText(/vos conversations/i)).toBeVisible();
  });

  test('empty state shows "Aucune conversation pour le moment."', async ({
    page,
  }) => {
    await expect(
      page.getByText(/aucune conversation pour le moment/i),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('search input is visible', async ({ page }) => {
    await expect(
      page.getByPlaceholder(/rechercher une conversation/i),
    ).toBeVisible();
  });

  test('compose button ("Nouvelle conversation") is visible and links to /app/messages/new', async ({
    page,
  }) => {
    const composeLink = page.getByRole('link', {
      name: /nouvelle conversation/i,
    });
    await expect(composeLink).toBeVisible();
    await expect(composeLink).toHaveAttribute('href', '/app/messages/new');
  });

  test('clicking the compose button navigates to /app/messages/new', async ({
    page,
  }) => {
    await page
      .getByRole('link', { name: /nouvelle conversation/i })
      .click();
    await expect(page).toHaveURL('/app/messages/new');
  });
});

// ── Messages list — with conversations ───────────────────────────────────────

test.describe('Messages — liste avec conversations', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/messaging/conversations/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: CONVERSATIONS_WITH_DATA,
      }),
    );

    // Also mock the user endpoint used to resolve current user id.
    await page.route('**/v1/users/me/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-a',
          email: 'jean@exemple.com',
          profile: { first_name: 'Jean', last_name: 'Dupont', phone: '' },
        }),
      }),
    );

    await page.goto('/app/messages');
  });

  test('shows the other participant name in the conversation list', async ({
    page,
  }) => {
    // user-a is the current user, so user-b (Marie Sow) should be shown.
    await expect(page.getByText('Marie Sow')).toBeVisible({ timeout: 8_000 });
  });

  test('shows the last message preview', async ({ page }) => {
    await expect(page.getByText(/bonjour marie/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  test('unread badge is visible when unread_count > 0', async ({ page }) => {
    // The badge renders the number 2 for our stub.
    await expect(page.getByText('2')).toBeVisible({ timeout: 8_000 });
  });

  test('clicking a conversation navigates to /app/messages/[id]', async ({
    page,
  }) => {
    // Mock the messages endpoint for the detail view so it doesn't 404.
    await page.route('**/v1/messaging/conversations/conv-1/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, results: [] }),
      }),
    );

    await page.getByText('Marie Sow').click();
    await expect(page).toHaveURL('/app/messages/conv-1', { timeout: 8_000 });
  });
});

// ── New conversation ──────────────────────────────────────────────────────────

test.describe('Messages — nouvelle conversation', () => {
  test.beforeEach(async ({ page }) => {
    // Stub the ministers / priests search endpoint used by NewConversation.
    await page.route('**/v1/messaging/priests/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, results: [] }),
      }),
    );

    await page.goto('/app/messages/new');
  });

  test('page loads without crashing', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('has a search input to find users', async ({ page }) => {
    // The new-conversation page should have some kind of search field.
    await expect(
      page
        .getByRole('searchbox')
        .or(page.getByPlaceholder(/rechercher|chercher|search/i))
        .first(),
    ).toBeVisible({ timeout: 8_000 });
  });
});
