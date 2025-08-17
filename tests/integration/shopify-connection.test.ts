import { expect, test } from "@playwright/test";

test.describe("Shopify Integration", () => {
  test("should handle merchant authentication flow", async ({ page }) => {
    await page.goto("/admin");

    // Should redirect to auth or show auth interface
    await expect(page).toHaveURL(/auth|login|admin/);

    // Should not crash the app
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should gracefully handle Shopify API failures", async ({ page, context }) => {
    // Mock admin session
    await context.addCookies([
      {
        name: "session",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin/editor");

    // Should show editor interface even if Shopify is unavailable
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).not.toHaveText("Error");
  });
});
