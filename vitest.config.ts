import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Unified Vitest configuration for all packages
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./packages/test-utils/src/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        'out/',
        'build/',
        '*.config.*',
        '**/*.d.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/test-utils/**',
        '**/mocks/**',
        '**/fixtures/**',
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@minimall/core': path.resolve(__dirname, './packages/core/src'),
      '@minimall/db': path.resolve(__dirname, './packages/db/src'),
      '@minimall/ui': path.resolve(__dirname, './packages/ui/src'),
      '@minimall/types': path.resolve(__dirname, './packages/types/src'),
      '@minimall/config': path.resolve(__dirname, './packages/config/src'),
      '@minimall/webhooks': path.resolve(__dirname, './packages/webhooks/src'),
      '@minimall/api': path.resolve(__dirname, './packages/api/src'),
      '@minimall/test-utils': path.resolve(__dirname, './packages/test-utils/src'),
    },
  },
});