import { expect, test } from '@playwright/test';

/**
 * Smoke suite — verifies that all primary sections load correctly for an
 * authenticated user navigating through the bottom nav / sidebar.
 *
 * Auth state is injected via storageState (configured in playwright.config.ts).
 */

test.describe('Navigation smoke — authenticated user', () => {
  test('can reach the Bible & Liturgie page', async ({ page }) => {
    await page.goto('/app/bible');
    await expect(page).toHaveURL('/app/bible');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('bottom nav — Actus link navigates to news feed', async ({ page }) => {
    await page.goto('/app/bible');
    await page.getByRole('link', { name: /actus/i }).click();
    await expect(page).toHaveURL('/app/actus');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('bottom nav — Spirituel link navigates to spiritual page', async ({
    page,
  }) => {
    await page.goto('/app/bible');
    await page.getByRole('link', { name: /spirituel/i }).click();
    await expect(page).toHaveURL('/app/spirituel');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('bottom nav — Messages link navigates to messages', async ({ page }) => {
    await page.goto('/app/bible');
    await page.getByRole('link', { name: /messages/i }).click();
    await expect(page).toHaveURL('/app/messages');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('bottom nav — Profil link navigates to profile', async ({ page }) => {
    await page.goto('/app/bible');
    await page.getByRole('link', { name: /profil/i }).click();
    await expect(page).toHaveURL('/app/profil');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('direct route — /app/documents loads', async ({ page }) => {
    await page.goto('/app/documents');
    await expect(page).toHaveURL('/app/documents');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('direct route — /app/chapelet loads', async ({ page }) => {
    await page.goto('/app/chapelet');
    await expect(page).toHaveURL('/app/chapelet');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('direct route — /app/tv loads', async ({ page }) => {
    await page.goto('/app/tv');
    await expect(page).toHaveURL('/app/tv');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('direct route — /app/assistant loads', async ({ page }) => {
    await page.goto('/app/assistant');
    await expect(page).toHaveURL('/app/assistant');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('sequential full navigation through all bottom-nav items', async ({
    page,
  }) => {
    await page.goto('/app/bible');
    await expect(page).toHaveURL('/app/bible');

    await page.getByRole('link', { name: /actus/i }).click();
    await expect(page).toHaveURL('/app/actus');

    await page.getByRole('link', { name: /spirituel/i }).click();
    await expect(page).toHaveURL('/app/spirituel');

    await page.getByRole('link', { name: /messages/i }).click();
    await expect(page).toHaveURL('/app/messages');

    await page.getByRole('link', { name: /profil/i }).click();
    await expect(page).toHaveURL('/app/profil');
  });
});
