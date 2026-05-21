import { expect, test } from '@playwright/test';

/**
 * Documents — list, new document wizard (5 steps), empty state.
 *
 * API calls are mocked so the suite runs without a real backend.
 */

const EMPTY_DOCUMENTS_RESPONSE = JSON.stringify({
  count: 0,
  results: [],
});

const DOCUMENT_CREATED_RESPONSE = JSON.stringify({
  id: 42,
  document_type: 'baptism',
  status: 'submitted',
  created_at: new Date().toISOString(),
  reason: 'personal',
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function mockEmptyDocuments(page: import('@playwright/test').Page) {
  await page.route('**/v1/documents/requests/**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: EMPTY_DOCUMENTS_RESPONSE,
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: DOCUMENT_CREATED_RESPONSE,
      });
    } else {
      await route.continue();
    }
  });
}

// ── List page ─────────────────────────────────────────────────────────────────

test.describe('Liste des documents', () => {
  test.beforeEach(async ({ page }) => {
    await mockEmptyDocuments(page);
    await page.goto('/app/documents');
  });

  test('page loads with "Documents" heading', async ({ page }) => {
    await expect(page.getByText(/^documents$/i)).toBeVisible();
  });

  test('shows empty state when there are no documents', async ({ page }) => {
    await expect(page.getByText(/aucune demande/i)).toBeVisible({
      timeout: 8_000,
    });
  });

  test('empty state has a "Nouvelle demande" button linking to /app/documents/new', async ({
    page,
  }) => {
    const newRequestBtn = page.getByRole('link', {
      name: /nouvelle demande/i,
    });
    await expect(newRequestBtn).toBeVisible({ timeout: 8_000 });
    await expect(newRequestBtn).toHaveAttribute('href', '/app/documents/new');
  });

  test('header action button ("+") links to /app/documents/new', async ({
    page,
  }) => {
    await expect(
      page.getByRole('link', { name: /nouvelle demande/i }).first(),
    ).toHaveAttribute('href', '/app/documents/new');
  });

  test('clicking "Nouvelle demande" navigates to the wizard', async ({
    page,
  }) => {
    await page
      .getByRole('link', { name: /nouvelle demande/i })
      .first()
      .click();
    await expect(page).toHaveURL('/app/documents/new');
  });
});

// ── Wizard — step 1 ──────────────────────────────────────────────────────────

test.describe('Formulaire — Étape 1 : Type & Motif', () => {
  test.beforeEach(async ({ page }) => {
    await mockEmptyDocuments(page);
    await page.goto('/app/documents/new');
  });

  test('wizard title "Nouvelle demande" is shown', async ({ page }) => {
    await expect(page.getByText('Nouvelle demande')).toBeVisible();
  });

  test('step indicator shows "Étape 1 sur 5 — Type"', async ({ page }) => {
    await expect(page.getByText(/étape 1 sur 5/i)).toBeVisible();
  });

  test('all document type options are visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /certificat de baptême/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /attestation de première communion/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /attestation de confirmation/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /attestation de mariage religieux/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /attestation parrain \/ marraine/i }),
    ).toBeVisible();
  });

  test('all reason options are visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /^mariage religieux$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^parrain \/ marraine$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /inscription catéchèse/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /dossier paroissial/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /usage personnel/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^autre$/i }),
    ).toBeVisible();
  });

  test('selecting type and reason enables the "Continuer" button to proceed', async ({
    page,
  }) => {
    await page
      .getByRole('button', { name: /certificat de baptême/i })
      .click();
    await page.getByRole('button', { name: /usage personnel/i }).click();

    const continuerBtn = page.getByRole('button', { name: /continuer/i });
    await continuerBtn.click();

    // After a valid step 1, the wizard advances to step 2.
    await expect(page.getByText(/étape 2 sur 5/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test('"Retour" button on step 1 navigates back (history back)', async ({
    page,
  }) => {
    // Navigate from the list page so there's history to go back to.
    await page.goto('/app/documents');
    await page
      .getByRole('link', { name: /nouvelle demande/i })
      .first()
      .click();
    await expect(page).toHaveURL('/app/documents/new');

    await page.getByRole('button', { name: /retour/i }).click();

    await expect(page).toHaveURL('/app/documents');
  });
});

// ── Wizard — step 2 ──────────────────────────────────────────────────────────

test.describe('Formulaire — Étape 2 : Identité', () => {
  test.beforeEach(async ({ page }) => {
    await mockEmptyDocuments(page);
    await page.goto('/app/documents/new');

    // Complete step 1 to advance to step 2.
    await page
      .getByRole('button', { name: /certificat de baptême/i })
      .click();
    await page.getByRole('button', { name: /usage personnel/i }).click();
    await page.getByRole('button', { name: /continuer/i }).click();
    await expect(page.getByText(/étape 2 sur 5/i)).toBeVisible();
  });

  test('identity step has required fields', async ({ page }) => {
    await expect(page.locator('#req_first')).toBeVisible();
    await expect(page.locator('#req_last')).toBeVisible();
    await expect(page.locator('#dob')).toBeVisible();
    await expect(page.locator('#pob')).toBeVisible();
  });

  test('filling identity fields and clicking Continuer advances to step 3', async ({
    page,
  }) => {
    await page.locator('#req_first').fill('Jean-Baptiste');
    await page.locator('#req_last').fill('Diallo');
    await page.locator('#dob').fill('1990-06-15');
    await page.locator('#pob').fill('Dakar');

    await page.getByRole('button', { name: /continuer/i }).click();

    await expect(page.getByText(/étape 3 sur 5/i)).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ── Wizard — happy path (all 5 steps) ────────────────────────────────────────

test.describe('Formulaire — parcours complet', () => {
  test.beforeEach(async ({ page }) => {
    await mockEmptyDocuments(page);
  });

  test('submitting all 5 steps creates a document and redirects to /app/documents', async ({
    page,
  }) => {
    await page.goto('/app/documents/new');

    // Step 1 — Type & Motif
    await page
      .getByRole('button', { name: /certificat de baptême/i })
      .click();
    await page.getByRole('button', { name: /usage personnel/i }).click();
    await page.getByRole('button', { name: /continuer/i }).click();
    await expect(page.getByText(/étape 2 sur 5/i)).toBeVisible();

    // Step 2 — Identité
    await page.locator('#req_first').fill('Jean-Baptiste');
    await page.locator('#req_last').fill('Diallo');
    await page.locator('#dob').fill('1990-06-15');
    await page.locator('#pob').fill('Dakar');
    await page.getByRole('button', { name: /continuer/i }).click();
    await expect(page.getByText(/étape 3 sur 5/i)).toBeVisible();

    // Step 3 — Sacrement
    await page.locator('#father_last').fill('Mamadou Diallo');
    await page.locator('#mother_last').fill('Fatou Ndiaye');
    await page.locator('#parish_name').fill('Paroisse Saint-Pierre de Dakar');
    await page.locator('#diocese').fill('Diocèse de Dakar');
    await page.locator('#sac_date').fill('2000');
    await page.locator('#sac_loc').fill('Dakar');
    await page.getByRole('button', { name: /continuer/i }).click();
    await expect(page.getByText(/étape 4 sur 5/i)).toBeVisible();

    // Step 4 — Contact
    await page.locator('#contact_phone').fill('+221771234567');
    await page.locator('#contact_email').fill('jean@exemple.com');
    await page.getByRole('button', { name: /continuer/i }).click();
    await expect(page.getByText(/étape 5 sur 5/i)).toBeVisible();

    // Step 5 — Validation (consent)
    // The CheckCircle2 button has text starting with "Je certifie…"
    await page.getByText(/je certifie que les informations/i).click();

    await page.getByRole('button', { name: /envoyer la demande/i }).click();

    // After successful submission the wizard redirects to the documents list.
    await expect(page).toHaveURL('/app/documents', { timeout: 15_000 });
  });
});
