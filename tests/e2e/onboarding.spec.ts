/**
 * Tests E2E - Onboarding complet
 * 
 * Sources:
 * - Playwright Testing: https://playwright.dev/docs/intro
 * - Supabase Auth: https://supabase.com/docs/guides/auth
 * 
 * Dates de test: Octobre et Novembre 2025
 */

import { test, expect } from "@playwright/test";

// Email de test unique pour éviter les conflits
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = "Test12345!2025";

test.describe("Onboarding Propriétaire - Test réel", () => {
  test("Parcours complet d'inscription propriétaire", async ({ page }) => {
    // Étape 1: Choix du rôle
    await page.goto("/signup/role");
    await page.click('button:has-text("Choisir Propriétaire")');
    await expect(page).toHaveURL(/.*\/signup\/account.*role=owner/, { timeout: 10000 });

    // Étape 2: Création de compte
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Attendre la redirection vers vérification email
    await expect(page).toHaveURL(/.*\/signup\/verify-email/, { timeout: 10000 });

    // Note: En test réel, il faudrait vérifier l'email
    // Pour ce test, on simule la confirmation
    // Dans un vrai test, on utiliserait un service d'email de test
  });
});

test.describe("Onboarding Locataire - Test réel", () => {
  test("Parcours complet d'inscription locataire", async ({ page }) => {
    const tenantEmail = `tenant-${Date.now()}@example.com`;

    await page.goto("/signup/role");
    await page.click('button:has-text("Choisir Locataire")');
    await expect(page).toHaveURL(/.*\/signup\/account.*role=tenant/, { timeout: 10000 });

    await page.fill('input[type="email"]', tenantEmail);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/signup\/verify-email/, { timeout: 10000 });
  });
});

