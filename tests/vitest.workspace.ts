import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  // Core packages
  "packages/core",
  "packages/ui",
  "packages/db",

  // Apps
  "apps/public",
  "apps/admin",
]);
