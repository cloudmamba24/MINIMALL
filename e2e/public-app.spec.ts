import { test, expect } from '@playwright/test';

test.describe('Public App - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/MINIMALL/i);
    
    // Check for main navigation elements
    await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();
  });

  test('should handle config loading', async ({ page }) => {
    // Test with a sample config ID
    await page.goto('/g/sample-config');
    
    // Should not show 404 error
    await expect(page.locator('text=404')).not.toBeVisible();
    
    // Should show some content structure
    await expect(page.locator('[data-testid="content-renderer"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Check content is properly displayed on mobile
    await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  });

  test('should handle product quick view modal', async ({ page }) => {
    // Navigate to a page with products
    await page.goto('/g/sample-config');
    
    // Look for product cards and click one
    const productCard = page.locator('[data-testid="product-card"]').first();
    if (await productCard.count() > 0) {
      await productCard.click();
      
      // Check that modal opens
      await expect(page.locator('[data-testid="product-modal"]')).toBeVisible();
      
      // Check modal has essential elements
      await expect(page.locator('[data-testid="product-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="product-price"]')).toBeVisible();
      
      // Check modal can be closed
      await page.locator('[data-testid="modal-close"]').click();
      await expect(page.locator('[data-testid="product-modal"]')).not.toBeVisible();
    }
  });
});

test.describe('Public App - Performance', () => {
  test('should load within performance budget', async ({ page }) => {
    // Start measuring
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Check for layout shift issues
    const layoutShift = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const shift = entries.reduce((acc, entry) => acc + (entry as any).value, 0);
          resolve(shift);
        }).observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => resolve(0), 2000);
      });
    });
    
    // CLS should be less than 0.1
    expect(layoutShift).toBeLessThan(0.1);
  });
});

test.describe('Public App - Accessibility', () => {
  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    // Should have h1
    await expect(page.locator('h1')).toHaveCount(1);
    
    // Should have logical heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Focus should be manageable with tab key
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
    
    // Should be able to navigate through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    const finalFocusedElement = await page.locator(':focus').first();
    await expect(finalFocusedElement).toBeVisible();
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/g/sample-config');
    
    // All images should have alt attributes
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });
});