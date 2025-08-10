import type { SiteConfig } from "@minimall/core/client";
import { type RenderOptions, type RenderResult, render } from "@testing-library/react";
import type React from "react";

// Mock app context for testing
interface MockAppContext {
  config?: SiteConfig;
  cart?: Record<string, unknown>;
  isLoading?: boolean;
}

const defaultMockContext: MockAppContext = {
  isLoading: false,
};

const MockAppProvider = ({
  children,
  context = defaultMockContext,
}: {
  children: React.ReactNode;
  context?: MockAppContext;
}) => (
  <div data-testid="app-provider" data-context={JSON.stringify(context)}>
    {children}
  </div>
);

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  appContext?: MockAppContext;
}

/**
 * Custom render function for public app components
 */
export const renderWithAppContext = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { appContext, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockAppProvider context={appContext ?? defaultMockContext}>{children}</MockAppProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Mock Next.js router for testing
 */
export const createMockRouter = (overrides = {}) => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  ...overrides,
});

/**
 * Mock Next.js params/searchParams for testing
 */
export const createMockPageProps = (configId = "test-config", searchParams = {}) => ({
  params: Promise.resolve({ configId }),
  searchParams: Promise.resolve(searchParams),
});

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
