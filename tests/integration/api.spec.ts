import { test, expect } from '@playwright/test';

test.describe('API Health Checks', () => {
  test('should return healthy status from health endpoint', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  test('should handle 404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get('/api/non-existent-endpoint');
    expect(response.status()).toBe(404);
  });
});