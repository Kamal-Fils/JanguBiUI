import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = 'Password123!';
  const firstName = 'Jean';
  const lastName = 'Dupont';

  await page.goto('/auth/register');

  // registration:
  await page.getByLabel(/prénom/i).fill(firstName);
  await page.getByLabel(/nom/i).fill(lastName);
  await page.getByLabel(/adresse email/i).fill(email);
  await page.getByLabel(/téléphone/i).fill('+221700000000');
  await page.getByLabel(/mot de passe$/i).fill(password);
  await page.getByLabel(/confirmer le mot de passe/i).fill(password);
  await page.getByRole('button', { name: /s'inscrire/i }).click();
  await page.waitForURL('/app/bible');

  // log out:
  await page.getByRole('button', { name: /menu utilisateur/i }).click();
  await page.getByRole('menuitem', { name: /se déconnecter/i }).click();
  await page.waitForURL('/auth/login');

  // log in:
  await page.getByLabel(/adresse email/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL('/app/bible');

  await page.context().storageState({ path: authFile });
});
