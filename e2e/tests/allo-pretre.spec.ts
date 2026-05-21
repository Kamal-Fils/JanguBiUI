import { expect, test } from '@playwright/test';

/**
 * Allo Prêtre — directory page.
 *
 * The current implementation shows a "Bientôt disponible" (coming soon) screen.
 * These tests verify the page loads correctly and key content is present.
 * When the feature ships, these tests should be extended with the actual UI.
 */

test.describe('Allo Prêtre', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/allo-pretre');
  });

  test('page loads at /app/allo-pretre', async ({ page }) => {
    await expect(page).toHaveURL('/app/allo-pretre');
  });

  test('main content area is visible', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('page shows "Allo Prêtre" as the title', async ({ page }) => {
    await expect(page.getByText('Allo Prêtre')).toBeVisible();
  });

  test('subtitle "Contactez un guide spirituel" is visible', async ({
    page,
  }) => {
    await expect(
      page.getByText(/contactez un guide spirituel/i),
    ).toBeVisible();
  });

  test('shows the "Bientôt disponible" coming-soon message', async ({
    page,
  }) => {
    await expect(page.getByText(/bientôt disponible/i)).toBeVisible();
  });

  test('shows the description of the upcoming feature', async ({ page }) => {
    await expect(
      page.getByText(/mise en relation avec un guide spirituel/i),
    ).toBeVisible();
  });
});
