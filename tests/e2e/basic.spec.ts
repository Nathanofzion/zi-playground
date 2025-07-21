// tests/e2e/basic.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ZI Playground Basic Functionality', () => {
  test('homepage loads correctly', async ({ page }) => {
    // Navigate to your homepage
    await page.goto('/');
    
    // Check the page title
    await expect(page).toHaveTitle(/ZI Playground/);
    
    // Check that the main content is visible
    await expect(page.getByRole('main')).toBeVisible();
    
    // Monitor console for unexpected errors (excluding known warnings)
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('trustline')) {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Should have no unexpected console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('navigation is responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(nav).toBeVisible();
  });
});