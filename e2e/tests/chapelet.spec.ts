import { expect, test } from '@playwright/test';

/**
 * Chapelet — rosary page: mystery selector, group switching, guided mode.
 *
 * API responses are mocked for determinism.
 */

const ROSARY_TODAY = JSON.stringify({
  day: {
    group: {
      id: 2,
      name: 'Douloureux',
      mysteries:
        "Agonie au jardin des Oliviers\nFlagellation à la colonne\nCouronnement d'épines\nPortement de la croix\nCrucifixion et mort de Jésus",
      audio_file: null,
    },
  },
});

const ROSARY_GROUPS = JSON.stringify([
  {
    id: 1,
    name: 'Joyeux',
    mysteries:
      "Annonciation\nVisitation\nNativité\nPrésentation au Temple\nRecouvrement au Temple",
    audio_file: null,
  },
  {
    id: 2,
    name: 'Douloureux',
    mysteries:
      "Agonie au jardin des Oliviers\nFlagellation à la colonne\nCouronnement d'épines\nPortement de la croix\nCrucifixion et mort de Jésus",
    audio_file: null,
  },
  {
    id: 3,
    name: 'Glorieux',
    mysteries:
      'Résurrection\nAscension\nPentecôte\nAssomption\nCouronnement de Marie',
    audio_file: null,
  },
  {
    id: 4,
    name: 'Lumineux',
    mysteries:
      "Baptême de Jésus\nNoces de Cana\nAnnonce du Royaume\nTransfiguration\nInstitution de l'Eucharistie",
    audio_file: null,
  },
]);

test.describe('Chapelet', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/rosary/today/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: ROSARY_TODAY,
      }),
    );
    await page.route('**/v1/rosary/groups/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: ROSARY_GROUPS,
      }),
    );
    await page.goto('/app/chapelet');
  });

  // ── Page load ─────────────────────────────────────────────────────────────

  test('page renders the "Mon Chapelet Quotidien" heading', async ({
    page,
  }) => {
    await expect(page.getByText('Mon Chapelet Quotidien')).toBeVisible({
      timeout: 8_000,
    });
  });

  test('subtitle "Priez avec un guide jour après jour" is visible', async ({
    page,
  }) => {
    await expect(
      page.getByText(/priez avec un guide jour après jour/i),
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Mystery group selector ────────────────────────────────────────────────

  test('all four mystery groups are shown as pill buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /joyeux/i })).toBeVisible({
      timeout: 8_000,
    });
    await expect(
      page.getByRole('button', { name: /douloureux/i }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /glorieux/i })).toBeVisible({
      timeout: 8_000,
    });
    await expect(
      page.getByRole('button', { name: /lumineux/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('the today group "Douloureux" is shown in the selected-mystery card', async ({
    page,
  }) => {
    await expect(page.getByText(/mystères douloureux/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  test('individual mysteries from the stub are listed', async ({ page }) => {
    await expect(
      page.getByText(/agonie au jardin des oliviers/i),
    ).toBeVisible({ timeout: 8_000 });
  });

  // ── Group switching ───────────────────────────────────────────────────────

  test('clicking "Joyeux" pill switches the mystery card content', async ({
    page,
  }) => {
    await page.getByRole('button', { name: /^joyeux$/i }).click();

    await expect(page.getByText(/mystères joyeux/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(/annonciation/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test('clicking "Glorieux" pill shows Glorieux mysteries', async ({ page }) => {
    await page.getByRole('button', { name: /^glorieux$/i }).click();

    await expect(page.getByText(/mystères glorieux/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText(/résurrection/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  test('"Commencer le chapelet guidé" button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /commencer le chapelet guidé/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test('clicking "Commencer le chapelet guidé" switches to guide mode', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: /commencer le chapelet guidé/i })
      .click();

    // In guide mode the heading changes to "Chapelet Guide"
    await expect(page.getByText(/chapelet guide/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test('"Audio indisponible" button is shown when audio_file is null', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /audio indisponible/i }),
    ).toBeVisible({ timeout: 8_000 });
  });
});
