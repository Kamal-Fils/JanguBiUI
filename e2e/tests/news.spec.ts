import { expect, test } from '@playwright/test';

/**
 * Actualités — news feed list and article detail.
 *
 * API responses are mocked so the suite runs without a live backend.
 */

const ARTICLES_RESPONSE = JSON.stringify({
  count: 2,
  results: [
    {
      id: '1',
      title: 'Visite pastorale au Sénégal',
      excerpt: 'Le pape François…',
      cover_image_url: null,
      category: { id: 1, name: 'Actualité' },
      scope_type: 'global',
      published_at: new Date(Date.now() - 86_400_000).toISOString(),
      views_count: 142,
      content: "<p>Contenu de l'article.</p>",
    },
    {
      id: '2',
      title: 'Nouvelle chapelle inaugurée à Thiès',
      excerpt: 'La communauté de Thiès…',
      cover_image_url: null,
      category: { id: 2, name: 'Paroisse' },
      scope_type: 'global',
      published_at: new Date(Date.now() - 172_800_000).toISOString(),
      views_count: 57,
      content: '<p>Contenu du second article.</p>',
    },
  ],
});

const EMPTY_ARTICLES = JSON.stringify({ count: 0, results: [] });

const ARTICLE_DETAIL = JSON.stringify({
  id: '1',
  title: 'Visite pastorale au Sénégal',
  excerpt: 'Le pape François…',
  cover_image_url: null,
  category: { id: 1, name: 'Actualité' },
  scope_type: 'global',
  published_at: new Date(Date.now() - 86_400_000).toISOString(),
  views_count: 143,
  content: "<p>Contenu de l'article complet.</p>",
});

// ── News feed ─────────────────────────────────────────────────────────────────

test.describe('Actualités — liste', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/news/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: ARTICLES_RESPONSE,
      }),
    );
    await page.goto('/app/actus');
  });

  test('page renders "Actualités" as heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /actualités/i }),
    ).toBeVisible();
  });

  test('subtitle "La vie de l\'Église" is visible', async ({ page }) => {
    await expect(page.getByText(/la vie de l.église/i)).toBeVisible();
  });

  test('"Universel" and "Ma paroisse" tabs are visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /universel/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /ma paroisse/i }),
    ).toBeVisible();
  });

  test('articles from the API are listed', async ({ page }) => {
    await expect(
      page.getByText('Visite pastorale au Sénégal'),
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByText('Nouvelle chapelle inaugurée à Thiès'),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('articles are rendered as links to their detail pages', async ({
    page,
  }) => {
    const firstArticleLink = page.getByRole('link', {
      name: /visite pastorale au sénégal/i,
    });
    await expect(firstArticleLink).toBeVisible({ timeout: 8_000 });
    await expect(firstArticleLink).toHaveAttribute('href', '/app/actus/1');
  });

  test('clicking an article navigates to its detail page', async ({ page }) => {
    // Pre-stub the detail endpoint so the page doesn't error.
    await page.route('**/v1/news/1/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: ARTICLE_DETAIL,
      }),
    );

    await page
      .getByRole('link', { name: /visite pastorale au sénégal/i })
      .click();
    await expect(page).toHaveURL('/app/actus/1', { timeout: 8_000 });
  });

  test('switching to "Ma paroisse" tab changes the content area', async ({
    page,
  }) => {
    await page.route('**/v1/news/my-parish/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: EMPTY_ARTICLES,
      }),
    );

    await page.getByRole('button', { name: /ma paroisse/i }).click();

    // With the empty-articles mock the empty state is shown.
    await expect(
      page.getByText(/aucune actualité pour votre paroisse/i),
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ── Article detail ────────────────────────────────────────────────────────────

test.describe("Actualités — détail d'un article", () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/news/1/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: ARTICLE_DETAIL,
      }),
    );
    await page.goto('/app/actus/1');
  });

  test('detail page loads with the article title', async ({ page }) => {
    await expect(
      page.getByText('Visite pastorale au Sénégal'),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('detail page is at the correct URL', async ({ page }) => {
    await expect(page).toHaveURL('/app/actus/1');
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

test.describe('Actualités — état vide', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/news/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: EMPTY_ARTICLES,
      }),
    );
    await page.goto('/app/actus');
  });

  test('shows "Aucune actualité disponible." when there are no articles', async ({
    page,
  }) => {
    await expect(
      page.getByText(/aucune actualité disponible/i),
    ).toBeVisible({ timeout: 8_000 });
  });
});
