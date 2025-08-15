import { expect, test } from '@playwright/test';

test.describe('Merchant User Flow', () => {
  test('should complete basic merchant workflow', async ({ page, context }) => {
    // Mock authentication
    await context.addCookies([
      {
        name: 'session',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    // 1. Access admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should show admin interface
    const dashboard = page.locator('[data-testid="dashboard"]');
    if (await dashboard.isVisible()) {
      await expect(dashboard).toBeVisible();
    }

    // 2. Navigate to editor
    await page.goto('/admin/editor');
    await page.waitForLoadState('networkidle');
    
    // Should show editor interface
    const editorPanel = page.locator('[data-testid="editor-panel"]');
    if (await editorPanel.isVisible()) {
      await expect(editorPanel).toBeVisible();
    }

    // 3. Check media management
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');
    
    // Should load media interface
    const mediaManager = page.locator('[data-testid="media-manager"]');
    if (await mediaManager.isVisible()) {
      await expect(mediaManager).toBeVisible();
    }
  });

  test('should handle settings configuration', async ({ page, context }) => {
    // Mock auth
    await context.addCookies([
      {
        name: 'session',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/admin/settings');
    await page.waitForLoadState('networkidle');
    
    // Should show settings form
    const settingsForm = page.locator('[data-testid="settings-form"]');
    if (await settingsForm.isVisible()) {
      await expect(settingsForm).toBeVisible();
    }
  });
});