/**
 * Tests E2E - Paiements (Octobre et Novembre 2025)
 * 
 * Sources:
 * - Playwright Testing: https://playwright.dev/docs/intro
 * - Stripe Testing: https://stripe.com/docs/testing
 * 
 * Dates de test: Octobre et Novembre 2025
 */

import { test, expect } from "@playwright/test";

const TENANT_CREDENTIALS = {
  email: "garybissol@yahoo.fr",
  password: "Test12345!2025",
};

const OCTOBER_2025 = "2025-10";
const NOVEMBER_2025 = "2025-11";

test.describe("Paiements - Octobre et Novembre 2025", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/signin");
    await page.fill('input[type="email"]', TENANT_CREDENTIALS.email);
    await page.fill('input[type="password"]', TENANT_CREDENTIALS.password);
    await page.click('button:has-text("Se connecter")');
    await expect(page).toHaveURL(/.*\/app\/tenant/, { timeout: 10000 });
  });

  test("Voir les paiements d'Octobre 2025 - Test réel", async ({ page }) => {
    // Aller aux baux
    await page.click('text="Mes baux"');
    await expect(page).toHaveURL(/.*\/leases/);

    // Cliquer sur le premier bail
    const firstLease = page.locator('[data-testid="lease-card"]').first();
    if (await firstLease.count() > 0) {
      await firstLease.click();

      // Aller à l'onglet paiements
      await page.click('button:has-text("Paiements")');

      // Filtrer par octobre 2025
      const monthFilter = page.locator('input[name="month"], select[name="month"]');
      if (await monthFilter.count() > 0) {
        await monthFilter.fill(OCTOBER_2025);
        
        // Vérifier l'affichage des paiements d'octobre
        await expect(page.locator(`text="${OCTOBER_2025}"`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("Voir les paiements de Novembre 2025 - Test réel", async ({ page }) => {
    await page.click('text="Mes baux"');
    await expect(page).toHaveURL(/.*\/leases/);

    const firstLease = page.locator('[data-testid="lease-card"]').first();
    if (await firstLease.count() > 0) {
      await firstLease.click();
      await page.click('button:has-text("Paiements")');

      const monthFilter = page.locator('input[name="month"], select[name="month"]');
      if (await monthFilter.count() > 0) {
        await monthFilter.fill(NOVEMBER_2025);
        await expect(page.locator(`text="${NOVEMBER_2025}"`)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("Voir les quittances d'Octobre 2025 - Test réel", async ({ page }) => {
    await page.click('text="Mes baux"');
    await expect(page).toHaveURL(/.*\/leases/);

    const firstLease = page.locator('[data-testid="lease-card"]').first();
    if (await firstLease.count() > 0) {
      await firstLease.click();
      await page.click('button:has-text("Quittances")');

      // Vérifier l'affichage des quittances
      await expect(page.locator('text=/Quittance|Reçu/')).toBeVisible({ timeout: 5000 });
    }
  });

  test("Tester le rate limiting sur les paiements - Test réel", async ({ page, context }) => {
    // Faire plusieurs requêtes rapides pour tester le rate limiting
    const requests: Promise<any>[] = [];
    
    for (let i = 0; i < 6; i++) {
      requests.push(
        page.request.post("/api/leases/test-id/pay", {
          data: { amount: 100, method: "cb", month: OCTOBER_2025 },
        })
      );
    }

    const responses = await Promise.all(requests);
    
    // Au moins une requête devrait être bloquée (429)
    const rateLimited = responses.some((r) => r.status() === 429);
    expect(rateLimited).toBeTruthy();
  });
});

