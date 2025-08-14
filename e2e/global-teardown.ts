import type { FullConfig } from "@playwright/test";

async function globalTeardown(_config: FullConfig) {
  console.log("🧹 Cleaning up E2E test environment...");

  // Clean up test data, close connections, etc.
  // Example:
  // await cleanupTestDatabase();

  console.log("✅ E2E test cleanup complete");
}

export default globalTeardown;
