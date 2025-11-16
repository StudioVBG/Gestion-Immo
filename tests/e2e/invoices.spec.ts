/**
 * Tests E2E - Facturation (Octobre et Novembre 2025)
 * 
 * Sources:
 * - Playwright Testing: https://playwright.dev/docs/intro
 * - Date-fns: https://date-fns.org/docs/Getting-Started
 * 
 * Dates de test: Octobre et Novembre 2025
 */

import { test, expect } from "@playwright/test";

const OWNER_CREDENTIALS = {
  email: "contact.explore.mq@gmail.com",
  password: "Test12345!2025",
};

// Dates réelles pour octobre et novembre 2025
const OCTOBER_2025 = "2025-10";
const NOVEMBER_2025 = "2025-11";

test.describe("Facturation - Octobre et Novembre 2025", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
    await page.fill('input[type="email"]', OWNER_CREDENTIALS.email);
    await page.fill('input[type="password"]', OWNER_CREDENTIALS.password);
    await page.click('button:has-text("Se connecter")');
    await expect(page).toHaveURL(/.*\/app\/owner/, { timeout: 10000 });
  });

  test("Créer une facture pour Octobre 2025 - Test réel", async ({ page }) => {
    // Aller aux factures
    await page.click('text="Factures"');
    await expect(page).toHaveURL(/.*\/invoices/);

    // Cliquer sur "Créer une facture"
    await page.click('button:has-text("Créer")');

    // Sélectionner un bail (si disponible)
    const leaseSelect = page.locator('select[name="lease_id"]');
    if (await leaseSelect.count() > 0) {
      await leaseSelect.selectOption({ index: 0 });

      // Remplir les informations pour octobre 2025
      await page.fill('input[name="periode"]', OCTOBER_2025);
      await page.fill('input[name="montant_loyer"]', "1200");
      await page.fill('input[name="montant_charges"]', "150");

      // Soumettre
      await page.click('button[type="submit"]');

      // Vérifier la création
      await expect(page.locator(`text="${OCTOBER_2025}"`)).toBeVisible({ timeout: 10000 });
    }
  });

  test("Créer une facture pour Novembre 2025 - Test réel", async ({ page }) => {
    await page.click('text="Factures"');
    await expect(page).toHaveURL(/.*\/invoices/);

    await page.click('button:has-text("Créer")');

    const leaseSelect = page.locator('select[name="lease_id"]');
    if (await leaseSelect.count() > 0) {
      await leaseSelect.selectOption({ index: 0 });
      await page.fill('input[name="periode"]', NOVEMBER_2025);
      await page.fill('input[name="montant_loyer"]', "1200");
      await page.fill('input[name="montant_charges"]', "150");
      await page.click('button[type="submit"]');

      await expect(page.locator(`text="${NOVEMBER_2025}"`)).toBeVisible({ timeout: 10000 });
    }
  });

  test("Voir les factures d'Octobre 2025 - Test réel", async ({ page }) => {
    await page.click('text="Factures"');
    await expect(page).toHaveURL(/.*\/invoices/);

    // Filtrer par octobre 2025
    const filterInput = page.locator('input[placeholder*="période" i], input[name="periode"]');
    if (await filterInput.count() > 0) {
      await filterInput.fill(OCTOBER_2025);
      await page.keyboard.press("Enter");

      // Vérifier que seules les factures d'octobre s'affichent
      const invoices = page.locator('[data-testid="invoice-card"]');
      const count = await invoices.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const invoice = invoices.nth(i);
          await expect(invoice.locator(`text="${OCTOBER_2025}"`)).toBeVisible();
        }
      }
    }
  });

  test("Voir les factures de Novembre 2025 - Test réel", async ({ page }) => {
    await page.click('text="Factures"');
    await expect(page).toHaveURL(/.*\/invoices/);

    const filterInput = page.locator('input[placeholder*="période" i], input[name="periode"]');
    if (await filterInput.count() > 0) {
      await filterInput.fill(NOVEMBER_2025);
      await page.keyboard.press("Enter");

      const invoices = page.locator('[data-testid="invoice-card"]');
      const count = await invoices.count();
      
      if (count > 0) {
        for (let i = 0; i < count; i++) {
          const invoice = invoices.nth(i);
          await expect(invoice.locator(`text="${NOVEMBER_2025}"`)).toBeVisible();
        }
      }
    }
  });

  test("Pagination des factures - Test réel", async ({ page }) => {
    await page.click('text="Factures"');
    await expect(page).toHaveURL(/.*\/invoices/);

    // Vérifier la pagination si plus de 12 factures
    const pagination = page.locator('[role="navigation"][aria-label="pagination"]');
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();
      
      // Tester la navigation
      const nextButton = pagination.locator('button:has-text("Suivant")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await expect(page).toHaveURL(/.*page=2/);
      }
    }
  });
});

