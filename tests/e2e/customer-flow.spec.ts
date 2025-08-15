import { expect, test } from '@playwright/test';

test.describe('Customer User Flow', () => {
  test('should serve link-in-bio pages successfully', async ({ page }) => {
    // 1. Load homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle(/MINIMALL/i);
    await expect(page.locator('body')).toBeVisible();

    // 2. Load config page
    await page.goto('/g/sample-config');
    await page.waitForLoadState('networkidle');
    
    // Should not show 404
    await expect(page.locator('text=404')).not.toBeVisible();
    
    // Should show content
    const contentRenderer = page.locator('[data-testid="content-renderer"]');
    if (await contentRenderer.isVisible()) {
      await expect(contentRenderer).toBeVisible();
    }
  });

  test('should handle product interactions', async ({ page }) => {
    await page.goto('/g/sample-config');
    await page.waitForLoadState('networkidle');
    
    // Look for product cards
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.count() > 0) {
      await productCard.click();
      
      // Should show product modal
      const productModal = page.locator('[data-testid="product-modal"]');
      if (await productModal.isVisible()) {
        await expect(productModal).toBeVisible();
        
        // Should have essential product info
        await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
        await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
      }
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/g/sample-config');
    await page.waitForLoadState('networkidle');
    
    // Should not have horizontal scroll
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
    
    // Should show mobile navigation if present
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test with invalid config
    await page.goto('/g/non-existent-config');
    await page.waitForLoadState('networkidle');
    
    // Should show 404 or error message
    const hasError = await page.locator('text=404').isVisible() || 
                    await page.locator('[data-testid="error-message"]').isVisible();
    expect(hasError).toBe(true);
  });
});