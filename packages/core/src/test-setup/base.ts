import { beforeAll, beforeEach, vi } from 'vitest';

// Base test setup for all packages
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock common environment variables
  process.env.R2_ENDPOINT = 'https://test.r2.cloudflarestorage.com';
  process.env.R2_ACCESS_KEY = 'test-access-key';
  process.env.R2_SECRET = 'test-secret';
  process.env.R2_BUCKET_NAME = 'test-bucket';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/test';
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock console.warn for cleaner test output
console.warn = vi.fn();
console.error = vi.fn();