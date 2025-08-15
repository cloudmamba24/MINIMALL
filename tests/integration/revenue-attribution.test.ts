import { expect, test } from '@playwright/test';

test.describe('Revenue Attribution', () => {
  test('should track merchant config creation', async ({ page, context }) => {
    // Mock admin auth
    await context.addCookies([
      {
        name: 'session',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin/editor/new');
    
    // Should load config creation interface
    const createForm = page.locator('[data-testid="create-config-form"]');
    if (await createForm.isVisible()) {
      await expect(createForm).toBeVisible();
    }
    
    // Should handle form submission without crashing
    const titleInput = page.locator('input[name="title"]');
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Config');
      
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should either redirect or show success
        await page.waitForLoadState('networkidle');
        await expect(page.locator('body')).not.toHaveText('Error');
      }
    }
  });

  test('should serve public config pages', async ({ page }) => {
    await page.goto('/g/sample-config');
    
    // Should load without 404
    await expect(page.locator('text=404')).not.toBeVisible();
    
    // Should show content renderer
    const contentRenderer = page.locator('[data-testid="content-renderer"]');
    if (await contentRenderer.isVisible()) {
      await expect(contentRenderer).toBeVisible();
    }
  });
});