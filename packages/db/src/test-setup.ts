import { beforeAll, beforeEach, vi } from 'vitest';

// Mock database environment variables for tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
});

// Mock drizzle client for tests that don't need real DB
beforeEach(() => {
  vi.clearAllMocks();
});