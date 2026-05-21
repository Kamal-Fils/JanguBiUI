import { expect, test } from '@playwright/test';

/**
 * Profile page — rewritten in French to match the actual UI.
 *
 * Auth state is provided via storageState (configured in playwright.config.ts).
 * Each test navigates to /app/profil independently so tests are isolated.
 */

test.describe('Page de profil', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the profile update API so no real backend mutation occurs.
    await page.route('**/v1/users/me/**', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'ok' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/app/profil');
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test('page loads and shows "Informations personnelles" section', async ({
    page,
  }) => {
    await expect(
      page.getByText('Informations personnelles'),
    ).toBeVisible();
  });

  test('page shows "Changer le mot de passe" section', async ({ page }) => {
    await expect(page.getByText('Changer le mot de passe')).toBeVisible();
  });

  test('page shows "Session" section with logout button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /se déconnecter/i }),
    ).toBeVisible();
  });

  test('page shows "Zone de danger" with delete account button', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /supprimer mon compte/i }),
    ).toBeVisible();
  });

  // ── Profile info form ───────────────────────────────────────────────────────

  test('profile form contains Prénom, Nom and Téléphone fields', async ({
    page,
  }) => {
    await expect(page.getByLabel(/^prénom$/i)).toBeVisible();
    await expect(page.getByLabel(/^nom$/i)).toBeVisible();
    await expect(page.getByLabel(/téléphone/i)).toBeVisible();
  });

  test('submitting profile update shows "Profil mis à jour" notification', async ({
    page,
  }) => {
    // Mock the profile endpoint to return success before navigating.
    await page.route('**/v1/users/profile/', async (route) => {
      if (['PATCH', 'PUT'].includes(route.request().method())) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'ok' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.getByLabel(/^prénom$/i).clear();
    await page.getByLabel(/^prénom$/i).fill('Nouveau');

    await page.getByRole('button', { name: /enregistrer/i }).click();

    // The ProfilContent component fires addNotification({ message: 'Profil mis à jour' })
    await expect(page.getByText(/profil mis à jour/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  // ── Change password form ────────────────────────────────────────────────────

  test('change password form has "Mot de passe actuel" and "Nouveau mot de passe" fields', async ({
    page,
  }) => {
    await expect(page.getByLabel(/mot de passe actuel/i)).toBeVisible();
    await expect(page.getByLabel(/nouveau mot de passe/i)).toBeVisible();
  });

  test('change password submit button is labelled "Modifier le mot de passe"', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /modifier le mot de passe/i }),
    ).toBeVisible();
  });

  // ── Logout ──────────────────────────────────────────────────────────────────

  test('clicking "Se déconnecter" redirects to /auth/login', async ({
    page,
  }) => {
    // Intercept the logout API call so we don't need a real backend.
    await page.route('**/v1/auth/logout/**', async (route) =>
      route.fulfill({ status: 204, body: '' }),
    );

    await page.getByRole('button', { name: /se déconnecter/i }).click();

    await expect(page).toHaveURL('/auth/login', { timeout: 10_000 });
  });

  // ── Danger zone ─────────────────────────────────────────────────────────────

  test('clicking "Supprimer mon compte" shows a confirmation step', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: /supprimer mon compte/i })
      .click();

    // The UI renders a confirmation message and two buttons: Annuler / Confirmer
    await expect(
      page.getByRole('button', { name: /annuler/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /confirmer/i }),
    ).toBeVisible();
  });

  test('clicking "Annuler" hides the delete confirmation', async ({ page }) => {
    await page
      .getByRole('button', { name: /supprimer mon compte/i })
      .click();
    await page.getByRole('button', { name: /annuler/i }).click();

    // The original "Supprimer mon compte" button should reappear
    await expect(
      page.getByRole('button', { name: /supprimer mon compte/i }),
    ).toBeVisible();
  });
});
