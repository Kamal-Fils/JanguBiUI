import { expect, test } from '@playwright/test';

/**
 * Bible & Liturgie page — tab navigation and content.
 *
 * The API calls are mocked where needed so that the test is deterministic even
 * when the backend is unavailable.
 */

// Minimal API stubs — real data isn't required for tab-navigation tests.
const LITURGY_STUB = {
  date: new Date().toISOString().slice(0, 10),
  season: 'Temps ordinaire',
  mystery: '2e dimanche ordinaire',
  readings: [
    {
      id: 1,
      type: 'lecture',
      citation: 'Is 49, 3.5-6',
      text: "<p>Lecture du livre d'Isaïe.</p>",
    },
    {
      id: 2,
      type: 'psaume',
      citation: 'Ps 39',
      text: '<p>R/ Me voici, Seigneur.</p>',
    },
    {
      id: 3,
      type: 'évangile',
      citation: 'Jn 1, 29-34',
      text: '<p>En ce temps-là…</p>',
    },
  ],
};

const ROSARY_TODAY_STUB = {
  day: {
    group: {
      id: 1,
      name: 'Joyeux',
      mysteries: 'Annonciation\nVisitation\nNativité\nPrésentation\nRecouvrement',
      audio_file: null,
    },
  },
};

const ROSARY_GROUPS_STUB = [
  {
    id: 1,
    name: 'Joyeux',
    mysteries: 'Annonciation\nVisitation\nNativité\nPrésentation\nRecouvrement',
    audio_file: null,
  },
  {
    id: 2,
    name: 'Douloureux',
    mysteries: 'Agonie\nFlagellation\nCouronnement\nPortement\nCrucifixion',
    audio_file: null,
  },
];

test.describe('Bible & Liturgie', () => {
  test.beforeEach(async ({ page }) => {
    // Stub liturgy endpoint
    await page.route('**/v1/bible/liturgy/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LITURGY_STUB),
      }),
    );

    // Stub rosary today endpoint (used by DailyMysteryCard inside TodayTab)
    await page.route('**/v1/rosary/today/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ROSARY_TODAY_STUB),
      }),
    );

    // Stub rosary groups (used by ChapeletContent)
    await page.route('**/v1/rosary/groups/**', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(ROSARY_GROUPS_STUB),
      }),
    );

    await page.goto('/app/bible');
  });

  // ── Tab bar ─────────────────────────────────────────────────────────────────

  test('page loads with four tabs visible', async ({ page }) => {
    await expect(
      page.getByRole('tab', { name: /aujourd.?hui/i }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: /bible/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /messe/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /heures/i })).toBeVisible();
  });

  test('"Aujourd\'hui" tab is active by default', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /aujourd.?hui/i });
    await expect(tab).toHaveAttribute('data-state', 'active');
  });

  // ── Aujourd'hui tab ─────────────────────────────────────────────────────────

  test('"Aujourd\'hui" tab shows date navigator with navigation arrows', async ({
    page,
  }) => {
    await expect(
      page.getByRole('button', { name: /jour pr[eé]c[eé]dent/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /jour suivant/i }),
    ).toBeVisible();
  });

  test('"Aujourd\'hui" tab displays readings from the API stub', async ({
    page,
  }) => {
    // The stub returns readings typed "lecture", "psaume", "évangile"
    await expect(page.getByText(/lecture/i)).toBeVisible({ timeout: 8_000 });
  });

  // ── Bible tab ───────────────────────────────────────────────────────────────

  test('clicking "Bible" tab switches panel content', async ({ page }) => {
    await page.getByRole('tab', { name: /^bible$/i }).click();
    await expect(
      page.getByRole('tab', { name: /^bible$/i }),
    ).toHaveAttribute('data-state', 'active');
    // The BibleBooksTab should be visible (no crash)
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  // ── Messe tab ───────────────────────────────────────────────────────────────

  test('clicking "Messe" tab switches to the Messe panel', async ({ page }) => {
    await page.getByRole('tab', { name: /messe/i }).click();
    await expect(
      page.getByRole('tab', { name: /messe/i }),
    ).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  // ── Heures tab ──────────────────────────────────────────────────────────────

  test('clicking "Heures" tab switches to the Liturgie des Heures panel', async ({
    page,
  }) => {
    await page.getByRole('tab', { name: /heures/i }).click();
    await expect(
      page.getByRole('tab', { name: /heures/i }),
    ).toHaveAttribute('data-state', 'active');
    await expect(page.getByRole('tabpanel')).toBeVisible();
  });

  // ── Page header ─────────────────────────────────────────────────────────────

  test('page shows "Bible & Liturgie" in the header', async ({ page }) => {
    await expect(
      page.getByText('Bible & Liturgie'),
    ).toBeVisible();
  });
});
