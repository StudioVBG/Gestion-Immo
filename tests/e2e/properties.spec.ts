/**
 * Tests E2E - Gestion des logements
 * 
 * Sources:
 * - Playwright Testing: https://playwright.dev/docs/intro
 * - Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
 * 
 * Dates de test: Octobre et Novembre 2025
 */

import { test, expect } from "@playwright/test";

const OWNER_CREDENTIALS = {
  email: "contact.explore.mq@gmail.com",
  password: "Test12345!2025",
};

test.describe("Gestion des logements", () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant que propriétaire
    await page.goto("/auth/signin");
    await page.fill('input[type="email"]', OWNER_CREDENTIALS.email);
    await page.fill('input[type="password"]', OWNER_CREDENTIALS.password);
    await page.click('button:has-text("Se connecter")');
    await expect(page).toHaveURL(/.*\/app\/owner/, { timeout: 10000 });
  });

  test("Créer un logement - Test réel avec dates Octobre 2025", async ({ page }) => {
    // Aller à la page des logements
    await page.click('text="Mes logements"');
    await expect(page).toHaveURL(/.*\/properties/);

    // Cliquer sur "Ajouter un logement"
    await page.click('button:has-text("Ajouter un logement")');
    await expect(page).toHaveURL(/.*\/properties\/new/);

    // Remplir le formulaire avec des données réelles
    await page.fill('input[name="adresse_complete"]', "15 Avenue des Champs-Élysées");
    await page.fill('input[name="code_postal"]', "75008");
    await page.fill('input[name="ville"]', "Paris");
    await page.fill('input[name="departement"]', "75");
    await page.selectOption('select[name="type"]', "appartement");
    await page.fill('input[name="surface"]', "85");
    await page.fill('input[name="nb_pieces"]', "4");
    await page.check('input[name="ascenseur"]');

    // Soumettre
    await page.click('button[type="submit"]');

    // Vérifier la création
    await expect(page).toHaveURL(/.*\/properties/, { timeout: 10000 });
    await expect(page.locator('text="15 Avenue des Champs-Élysées"')).toBeVisible();
  });

  test("Voir la liste des logements - Test réel", async ({ page }) => {
    await page.click('text="Mes logements"');
    await expect(page).toHaveURL(/.*\/properties/);

    // Vérifier que la liste s'affiche
    await expect(page.locator('h2:has-text("Mes logements")')).toBeVisible();
    
    // Vérifier la pagination si plus de 12 logements
    const pagination = page.locator('[role="navigation"][aria-label="pagination"]');
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();
    }
  });

  test("Voir les détails d'un logement - Test réel", async ({ page }) => {
    await page.click('text="Mes logements"');
    await expect(page).toHaveURL(/.*\/properties/);

    // Cliquer sur le premier logement
    const firstProperty = page.locator('[data-testid="property-card"]').first();
    if (await firstProperty.count() > 0) {
      await firstProperty.click();
      
      // Vérifier les détails
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=/Adresse|Surface|Pièces/')).toBeVisible();
    }
  });

  test("Modifier un logement - Test réel", async ({ page }) => {
    await page.click('text="Mes logements"');
    await expect(page).toHaveURL(/.*\/properties/);

    // Trouver un logement et le modifier
    const editButton = page.locator('button:has-text("Modifier")').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Modifier la surface
      await page.fill('input[name="surface"]', "90");
      await page.click('button[type="submit"]');

      // Vérifier la mise à jour
      await expect(page.locator('text="90"')).toBeVisible({ timeout: 5000 });
    }
  });
});

