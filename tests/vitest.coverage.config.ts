import { resolve } from "node:path";
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "**/.next/**",
        "**/playwright-report/**",
        "**/test-results/**",
        "**/e2e/**",
        // Exclude generated files
        "**/__generated__/**",
        "**/migrations/**",
        // Exclude test files
        "**/*.{test,spec}.{js,ts,jsx,tsx}",
        "**/test-utils.*",
        "**/test-setup.*",
        // Exclude story files
        "**/*.stories.*",
        // Exclude config files
        "**/tailwind.config.*",
        "**/postcss.config.*",
        "**/next.config.*",
        "**/biome.json",
        "**/turbo.json",
        "**/vitest.workspace.ts",
      ],
      include: [
        "packages/**/*.{js,ts,jsx,tsx}",
        "apps/**/src/**/*.{js,ts,jsx,tsx}",
        "!apps/**/src/**/*.{test,spec}.{js,ts,jsx,tsx}",
        "!apps/**/src/**/*.stories.{js,ts,jsx,tsx}",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
        // Package-specific thresholds
        "packages/core": {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        "packages/ui": {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
        "packages/db": {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
      // Report uncovered lines
      reportOnFailure: true,
      skipFull: false,
    },
    // Additional test configuration for coverage runs
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test-setup.ts"],
    pool: "forks",
    maxConcurrency: 8,
    // Ensure we collect coverage from all relevant files
    collectCoverageFrom: [
      "packages/**/*.{js,ts,jsx,tsx}",
      "apps/**/src/**/*.{js,ts,jsx,tsx}",
      "!**/*.{test,spec}.{js,ts,jsx,tsx}",
      "!**/*.stories.{js,ts,jsx,tsx}",
      "!**/*.d.ts",
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
      "@/packages": resolve(__dirname, "./packages"),
      "@/apps": resolve(__dirname, "./apps"),
    },
  },
});
