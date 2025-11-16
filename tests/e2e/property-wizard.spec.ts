import { test, expect, Page } from "@playwright/test";

const OWNER_CREDENTIALS = {
  email: "contact.explore.mq@gmail.com",
  password: "Test12345!2025",
};

async function loginAsOwner(page: Page) {
  await page.goto("/auth/signin");
  await page.fill('input[type="email"]', OWNER_CREDENTIALS.email);
  await page.fill('input[type="password"]', OWNER_CREDENTIALS.password);
  await page.click('button:has-text("Se connecter")');
  await expect(page).toHaveURL(/.*\/app\/owner/, { timeout: 10_000 });
}

test.describe("Wizard de création de logement", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test("avance automatique et étapes dynamiques pour un parking", async ({ page }) => {
    await page.goto("/properties/new");
    await page.waitForSelector('[data-testid="property-wizard"]');

    const stepTitle = page.locator('[data-testid="wizard-step-title"]');
    await expect(stepTitle).toHaveText(/Type de bien/i);

    // Par défaut (appartement) l'étape Pièces & photos est visible
    await expect(page.locator('[data-testid="wizard-step-pieces"]')).toBeVisible();

    // Sélectionner Parking déclenche automatiquement l'étape suivante
    await page.selectOption('[data-testid="field-type_bien"]', "parking");

    await expect(stepTitle).toHaveText(/Adresse/i);
    await expect(page.locator('[data-testid="wizard-step-adresse"][data-active="true"]')).toBeVisible();

    // L'étape Pièces & photos disparaît pour le parking
    await expect(page.locator('[data-testid="wizard-step-pieces"]')).toHaveCount(0);
  });
});

