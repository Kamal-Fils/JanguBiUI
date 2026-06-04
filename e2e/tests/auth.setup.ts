import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

// Auth e2e = login d'un utilisateur SEEDÉ déjà onboardé (onboarding_state=completed).
// On évite le register → onboarding (sélection paroisse obligatoire) qui rendait
// l'ancien setup fragile (et qui ne menait plus à /app/bible). Login direct via
// l'UI actuelle → storageState authentifié réel, utilisable par tous les specs.
//
// Surchargeable par env si le seed change (cf. `make seed` / seed_demo).
const EMAIL = process.env.E2E_USER_EMAIL ?? 'aminata.fall@jangubidev.sn';
const PASSWORD = process.env.E2E_USER_PASSWORD ?? 'Jangu2024!';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByLabel(/adresse email/i).fill(EMAIL);
  await page.getByLabel(/mot de passe/i).fill(PASSWORD);
  await page.getByRole('button', { name: /se connecter/i }).click();

  // Fidèle onboardé → redirige hors de /auth vers l'espace app (getRoleHomePath = /app).
  await page.waitForURL((url) => url.pathname.startsWith('/app'), {
    timeout: 15_000,
  });

  await page.context().storageState({ path: authFile });
});
