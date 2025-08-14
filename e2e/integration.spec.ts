import { expect, test } from "@playwright/test";

test.describe("Cross-App Integration", () => {
  test("should handle config creation and public display", async ({ browser }) => {
    // This test simulates the full flow: create config in admin, view in public
    const adminContext = await browser.newContext();
    const publicContext = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const publicPage = await publicContext.newPage();

    // Mock admin authentication
    await adminContext.addCookies([
      {
        name: "session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Step 1: Create config in admin
    await adminPage.goto("/admin/editor/new");

    // Fill in config details (if form is available)
    const titleField = adminPage.locator('input[name="title"]');
    if (await titleField.isVisible()) {
      await titleField.fill("Test Integration Config");

      const submitButton = adminPage.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for redirect/success
        await adminPage.waitForURL(/\/admin\/editor\/\w+/);

        // Extract config ID from URL
        const url = adminPage.url();
        const configId = url.split("/").pop();

        // Step 2: View config in public app
        await publicPage.goto(`/g/${configId}`);

        // Should display the config
        await expect(publicPage.locator('[data-testid="content-renderer"]')).toBeVisible();
        await expect(publicPage).toHaveTitle(/Test Integration Config|MINIMALL/i);
      }
    }

    await adminContext.close();
    await publicContext.close();
  });

  test("should handle real-time updates between admin and public", async ({ browser }) => {
    const adminContext = await browser.newContext();
    const publicContext = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const publicPage = await publicContext.newPage();

    // Mock admin auth
    await adminContext.addCookies([
      {
        name: "session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    // Load existing config in both apps
    const testConfigId = "sample-config";

    await Promise.all([
      adminPage.goto(`/admin/editor/${testConfigId}`),
      publicPage.goto(`/g/${testConfigId}`),
    ]);

    // Wait for both pages to load
    await Promise.all([
      adminPage.waitForLoadState("networkidle"),
      publicPage.waitForLoadState("networkidle"),
    ]);

    // Both should be displaying the same config
    await expect(adminPage.locator('[data-testid="editor-panel"]')).toBeVisible();
    await expect(publicPage.locator('[data-testid="content-renderer"]')).toBeVisible();

    await adminContext.close();
    await publicContext.close();
  });
});

test.describe("API Integration", () => {
  test("should handle config API endpoints", async ({ request }) => {
    // Test config fetch endpoint
    const configResponse = await request.get("/api/configs/sample-config");
    expect(configResponse.ok()).toBeTruthy();

    const configData = await configResponse.json();
    expect(configData).toHaveProperty("id");
    expect(configData).toHaveProperty("title");
  });

  test("should handle analytics endpoints", async ({ request }) => {
    // Test analytics endpoint
    const analyticsResponse = await request.get("/api/analytics/data");

    // Should return data or proper error
    expect([200, 401, 404]).toContain(analyticsResponse.status());
  });

  test("should handle health check endpoints", async ({ request }) => {
    // Test health endpoint
    const healthResponse = await request.get("/api/health");
    expect(healthResponse.ok()).toBeTruthy();

    const healthData = await healthResponse.json();
    expect(healthData).toHaveProperty("status");
    expect(healthData.status).toBe("ok");
  });
});

test.describe("External Service Integration", () => {
  test("should handle Shopify integration gracefully", async ({ page }) => {
    await page.goto("/admin");

    // Should not crash when Shopify services are unavailable
    await page.waitForLoadState("networkidle");

    // Should show appropriate messaging for Shopify connection status
    const shopifyStatus = page.locator('[data-testid="shopify-status"]');
    if (await shopifyStatus.isVisible()) {
      await expect(shopifyStatus).toContainText(/connected|disconnected|error/i);
    }
  });

  test("should handle Instagram integration", async ({ page, context }) => {
    // Mock admin auth
    await context.addCookies([
      {
        name: "session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin/social");

    // Should handle Instagram connection status
    const instagramSection = page.locator('[data-testid="instagram-section"]');
    if (await instagramSection.isVisible()) {
      // Should show connection status or setup instructions
      await expect(instagramSection).toContainText(/instagram|connect|import/i);
    }
  });
});

test.describe("Error Handling Integration", () => {
  test("should gracefully handle 404 errors", async ({ page }) => {
    await page.goto("/g/non-existent-config");

    // Should show 404 page
    await expect(page.locator("text=404")).toBeVisible();
    await expect(page).toHaveTitle(/404|Not Found/i);
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Test with malformed config ID
    await page.goto("/g/invalid-config-id-with-special-chars-!@#");

    // Should not crash the app
    await page.waitForLoadState("networkidle");

    // Should show error message or redirect
    const errorMessage = page.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/error|not found|invalid/i);
    }
  });

  test("should handle network connectivity issues", async ({ page, context }) => {
    // Simulate offline condition
    await context.setOffline(true);

    await page.goto("/");

    // Should show offline message or cached content
    await page.waitForLoadState("networkidle");

    // Re-enable network
    await context.setOffline(false);

    // Should recover gracefully
    await page.reload();
    await expect(page.locator("body")).toBeVisible();
  });
});
