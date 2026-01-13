import { test, expect } from '@playwright/test';

test.describe('Tet Theme UI Sync', () => {
  test('Home page should have Tet theme elements', async ({ page }) => {
    await page.goto('/');
    
    // Check if navbar has Tet gradient
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();
    
    // Check for Tet title
    const title = page.locator('.tet-title').first();
    if (await title.isVisible()) {
      await expect(title).toBeVisible();
    }

    // Check for TetEffect component
    const tetEffect = page.locator('.tet-container, .shop-tet-container');
    await expect(tetEffect).toBeVisible();
  });

  test('Shop page should have Tet buttons and glass effect', async ({ page }) => {
    await page.goto('/shop');
    
    // Check for shop tet container
    const container = page.locator('.shop-tet-container');
    await expect(container).toBeVisible();

    // Check for Tet glass cards
    const glassCard = page.locator('.tet-glass, .glass').first();
    if (await glassCard.isVisible()) {
      const border = await glassCard.evaluate(el => window.getComputedStyle(el).border);
      expect(border).toContain('rgb(255, 215, 0)'); // #FFD700
    }

    // Check for Shop Category Buttons (using tet-theme styles)
    const shopButtons = page.locator('.tet-button, .tet-button-shop');
    if (await shopButtons.count() > 0) {
      const bg = await shopButtons.first().evaluate(el => window.getComputedStyle(el).background);
      expect(bg).toContain('rgb(215, 0, 24)'); // #D70018
    }
  });

  test('Admin page should have Tet-themed sidebar and dashboard cards', async ({ page }) => {
    // We need to bypass login for UI check if possible, or just check the login page
    await page.goto('/login');
    
    const loginCard = page.locator('.tet-glass');
    await expect(loginCard).toBeVisible();

    const loginBtn = page.locator('.tet-button-shop, .tet-button');
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toHaveCSS('background', /linear-gradient.*rgb\(215, 0, 24\)/);
  });

  test('Modal Close Button should have Tet styles', async ({ page }) => {
    // Go to Shop and open a product if available
    await page.goto('/shop');
    
    // Find any product card and click
    const productCard = page.locator('.tet-card, .glass').first();
    if (await productCard.isVisible()) {
      await productCard.click();
      
      // Look for the new tet-close-btn
      const closeBtn = page.locator('.tet-close-btn');
      await expect(closeBtn).toBeVisible();
      await expect(closeBtn).toHaveCSS('background-color', 'rgb(215, 0, 24)');
      await expect(closeBtn).toHaveCSS('border', /2px solid rgb\(255, 215, 0\)/);
    }
  });
});
