import { type RenderOptions, type RenderResult, render } from "@testing-library/react";
import type React from "react";
import { vi } from "vitest";

// Mock Shopify App Bridge context
interface MockAppBridgeContext {
  apiKey?: string;
  shop?: string;
  host?: string;
}

const MockAppBridgeProvider = ({
  children,
  context = {},
}: {
  children: React.ReactNode;
  context?: MockAppBridgeContext;
}) => (
  <div data-testid="app-bridge-provider" data-context={JSON.stringify(context)}>
    {children}
  </div>
);

// Mock Polaris AppProvider
const MockPolarisProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="polaris-provider">{children}</div>
);

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  appBridgeContext?: MockAppBridgeContext;
}

/**
 * Custom render function for admin app components
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { appBridgeContext, ...renderOptions } = options;

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockPolarisProvider>
      <MockAppBridgeProvider {...(appBridgeContext && { context: appBridgeContext })}>
        {children}
      </MockAppBridgeProvider>
    </MockPolarisProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

/**
 * Mock Shopify API response factory
 */
export const createMockShopifyApiResponse = <T,>(data: T) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(data),
});

/**
 * Mock Next.js API request/response
 */
export const createMockApiRequest = (method = "GET", body = {}) => ({
  method,
  body: JSON.stringify(body),
  headers: {
    "content-type": "application/json",
  },
});

export const createMockApiResponse = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const setHeader = vi.fn();

  return {
    json,
    status,
    setHeader,
  };
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
