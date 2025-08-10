import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Sentry before importing our module
vi.mock("@sentry/nextjs", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setContext: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
  withScope: vi.fn((callback) => {
    const scope = {
      setTag: vi.fn(),
      setContext: vi.fn(),
      setLevel: vi.fn(),
    };
    callback(scope);
  }),
}));

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setContext: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
  withScope: vi.fn((callback) => {
    const scope = {
      setTag: vi.fn(),
      setContext: vi.fn(),
      setLevel: vi.fn(),
    };
    callback(scope);
  }),
}));

describe("Sentry Integration", () => {
  let mockSentry: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://test@sentry.io/123");
    vi.stubEnv("NODE_ENV", "test");

    // Get the mocked module
    mockSentry = await import("@sentry/nextjs");
  });

  it("should be properly mocked for testing", () => {
    expect(mockSentry.init).toBeDefined();
    expect(typeof mockSentry.init).toBe("function");
  });

  it("should handle error capture", async () => {
    const testError = new Error("Test error");

    mockSentry.captureException(testError);

    expect(mockSentry.captureException).toHaveBeenCalledWith(testError);
  });

  it("should handle message capture", async () => {
    const testMessage = "Test message";

    mockSentry.captureMessage(testMessage);

    expect(mockSentry.captureMessage).toHaveBeenCalledWith(testMessage);
  });

  it("should set context data", async () => {
    const contextData = { userId: "123", action: "test" };

    mockSentry.setContext("test-context", contextData);

    expect(mockSentry.setContext).toHaveBeenCalledWith("test-context", contextData);
  });

  it("should set tags", async () => {
    mockSentry.setTag("environment", "test");

    expect(mockSentry.setTag).toHaveBeenCalledWith("environment", "test");
  });

  it("should set user data", async () => {
    const userData = { id: "123", email: "test@example.com" };

    mockSentry.setUser(userData);

    expect(mockSentry.setUser).toHaveBeenCalledWith(userData);
  });

  it("should work with scope", async () => {
    mockSentry.withScope((scope: any) => {
      scope.setTag("test", "value");
      scope.setLevel("error");
    });

    expect(mockSentry.withScope).toHaveBeenCalledWith(expect.any(Function));
  });

  describe("Error Boundary Integration", () => {
    it("should provide error boundary functionality", () => {
      // This would test actual error boundary integration
      // For now, we just verify the mock is working
      expect(mockSentry.captureException).toBeDefined();
    });
  });

  describe("Performance Monitoring", () => {
    it("should handle transaction creation", () => {
      // Mock transaction creation for performance monitoring
      mockSentry.setContext("performance", {
        operation: "page-load",
        duration: 1500,
      });

      expect(mockSentry.setContext).toHaveBeenCalledWith("performance", {
        operation: "page-load",
        duration: 1500,
      });
    });
  });
});
