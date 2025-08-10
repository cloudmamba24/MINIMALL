// Basic test setup for admin app
import { vi } from "vitest";

// Mock environment variables for tests
process.env.NODE_ENV = "test";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

// Mock Next.js router for vitest
vi.mock("next/router", () => ({
  useRouter: () => ({
    route: "/",
    pathname: "/",
    query: {},
    asPath: "/",
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Admin-specific test configuration can be added here
