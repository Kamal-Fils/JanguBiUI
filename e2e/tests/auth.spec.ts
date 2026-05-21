import { expect, test } from '@playwright/test';

/**
 * Auth flows — login, register, forgot-password, logout.
 *
 * These tests deliberately bypass the shared storageState so they can exercise
 * unauthenticated flows from a clean browser context.
 */

// Credentials that match the account created by auth.setup.ts.
// They are intentionally wrong in the "invalid credentials" test.
const VALID_EMAIL = process.env.E2E_USER_EMAIL ?? 'e2e-user@example.com';
const VALID_PASSWORD = process.env.E2E_USER_PASSWORD ?? 'Password123!';

// Strip saved auth so each test starts unauthenticated.
test.use({ storageState: { cookies: [], origins: [] } });

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('page renders the login form', async ({ page }) => {
    await expect(
      page.getByLabel(/email address/i).or(page.getByLabel(/adresse email/i)),
    ).toBeVisible();
    await expect(
      page.getByLabel(/password/i).or(page.getByLabel(/mot de passe/i)),
    ).toBeVisible();
  });

  test('shows an error for invalid credentials', async ({ page }) => {
    await page
      .getByLabel(/email address/i)
      .or(page.getByLabel(/adresse email/i))
      .fill('mauvais@exemple.com');
    await page
      .getByLabel(/password/i)
      .or(page.getByLabel(/mot de passe/i))
      .fill('MotDePasseInvalide999!');
    await page.getByRole('button', { name: /log in|se connecter/i }).click();

    // Either an inline error or a toast notification must appear.
    await expect(
      page
        .getByRole('alert')
        .or(page.getByText(/identifiants|incorrect|invalide|invalid/i)),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('valid credentials redirect to /app/bible (or /app)', async ({
    page,
  }) => {
    // This test relies on the account created by auth.setup.ts having been
    // persisted in the backend.  We use environment variables so the email is
    // consistent between setup and this test.  If E2E_USER_EMAIL is not set,
    // the test is skipped to avoid false failures.
    if (!process.env.E2E_USER_EMAIL) {
      test.skip(true, 'E2E_USER_EMAIL not set — skipping live login test');
    }

    await page
      .getByLabel(/email address/i)
      .or(page.getByLabel(/adresse email/i))
      .fill(VALID_EMAIL);
    await page
      .getByLabel(/password/i)
      .or(page.getByLabel(/mot de passe/i))
      .fill(VALID_PASSWORD);
    await page.getByRole('button', { name: /log in|se connecter/i }).click();

    await expect(page).toHaveURL(/\/app(\/bible)?/, { timeout: 15_000 });
  });

  test('has a link to the registration page', async ({ page }) => {
    // The register link text varies between "Register" (current code) and
    // "S'inscrire" in the French UI spec.
    await expect(
      page
        .getByRole('link', { name: /register|s'inscrire|créer un compte/i })
        .first(),
    ).toBeVisible();
  });

  test('has a "Mot de passe oublié ?" link', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /mot de passe oublié/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

test.describe('Register', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
  });

  test('page renders all required fields', async ({ page }) => {
    await expect(page.getByLabel(/civilité/i)).toBeVisible();
    await expect(page.getByLabel(/prénom/i)).toBeVisible();
    await expect(page.getByLabel(/^nom$/i)).toBeVisible();
    await expect(page.getByLabel(/adresse email/i)).toBeVisible();
    await expect(page.getByLabel(/téléphone/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe$/i)).toBeVisible();
    await expect(page.getByLabel(/confirmer le mot de passe/i)).toBeVisible();
  });

  test('creates a new account and redirects to /app/bible (or /app)', async ({
    page,
  }) => {
    const unique = Date.now();
    const email = `e2e-reg-${unique}@example.com`;

    await page.getByLabel(/civilité/i).selectOption('MR');
    await page.getByLabel(/prénom/i).fill('Marie');
    await page.getByLabel(/^nom$/i).fill('Test');
    await page.getByLabel(/adresse email/i).fill(email);
    await page.getByLabel(/téléphone/i).fill('+221700000001');
    await page.getByLabel(/mot de passe$/i).fill('Password123!');
    await page.getByLabel(/confirmer le mot de passe/i).fill('Password123!');

    await page
      .getByRole('button', { name: /créer mon compte|s'inscrire/i })
      .click();

    await expect(page).toHaveURL(/\/app(\/bible)?/, { timeout: 15_000 });
  });

  test('has a link back to the login page', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /se connecter/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Forgot password
// ---------------------------------------------------------------------------

test.describe('Forgot password', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/forgot-password');
  });

  test('page renders the email field and submit button', async ({ page }) => {
    await expect(page.getByLabel(/adresse email/i)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /envoyer le lien/i }),
    ).toBeVisible();
  });

  test('submitting an email shows the confirmation message', async ({
    page,
  }) => {
    await page.getByLabel(/adresse email/i).fill('test@exemple.com');
    await page.getByRole('button', { name: /envoyer le lien/i }).click();

    // After a successful (or silently failed) submission, the UI shows a
    // confirmation message so as not to leak whether the account exists.
    await expect(
      page.getByText(/si cette adresse est enregistrée/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('has a link back to the login page', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /retour à la connexion/i }),
    ).toBeVisible();
  });

  test('submit button is disabled for an invalid email', async ({ page }) => {
    await page.getByLabel(/adresse email/i).fill('pas-un-email');
    await page.getByLabel(/adresse email/i).blur();

    // Button should remain disabled until the email is valid.
    await expect(
      page.getByRole('button', { name: /envoyer le lien/i }),
    ).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Logout — requires an authenticated session, so we use the shared state
// but override it here with a temporary fresh login.
// ---------------------------------------------------------------------------

test.describe('Logout', () => {
  // For the logout test we need a real authenticated session.  We re-use the
  // global storageState rather than stripping it.
  test.use({ storageState: 'e2e/.auth/user.json' });

  test('logout button on profile page redirects to /auth/login', async ({
    page,
  }) => {
    await page.goto('/app/profil');

    await page.getByRole('button', { name: /se déconnecter/i }).click();

    await expect(page).toHaveURL('/auth/login', { timeout: 10_000 });
  });
});
