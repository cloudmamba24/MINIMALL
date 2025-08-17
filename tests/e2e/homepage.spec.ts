import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Check that the page loads without errors
    await expect(page).toHaveTitle(/MINIMALL/i);

    // Basic smoke test - page should have some content
    const body = await page.locator("body");
    await expect(body).toBeVisible();
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/");

    // Check for main navigation elements
    const mainContent = await page.locator("main, #__next, #root, .app");
    await expect(mainContent.first()).toBeVisible();
  });
});
