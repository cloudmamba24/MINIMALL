// Shopify Polaris mocks
vi.mock("@shopify/polaris", () => {
  const mockComponent =
    (name: string) =>
    ({ children, ...props }: any) =>
      React.createElement("div", { "data-testid": name.toLowerCase(), ...props }, children);

  return {
    AppProvider: mockComponent("AppProvider"),
    Page: mockComponent("Page"),
    Card: mockComponent("Card"),
    CardSection: mockComponent("CardSection"),
    Button: mockComponent("Button"),
    TextField: mockComponent("TextField"),
    Select: mockComponent("Select"),
    Layout: mockComponent("Layout"),
    LayoutSection: mockComponent("LayoutSection"),
    Banner: mockComponent("Banner"),
    Toast: mockComponent("Toast"),
    Modal: mockComponent("Modal"),
    Loading: mockComponent("Loading"),
    Spinner: mockComponent("Spinner"),
    EmptyState: mockComponent("EmptyState"),
    ResourceList: mockComponent("ResourceList"),
    ResourceItem: mockComponent("ResourceItem"),
    DataTable: mockComponent("DataTable"),
    Pagination: mockComponent("Pagination"),
    Tabs: mockComponent("Tabs"),
    Tab: mockComponent("Tab"),
    Stack: mockComponent("Stack"),
    StackItem: mockComponent("StackItem"),
  };
});

// Mock Shopify App Bridge
vi.mock("@shopify/app-bridge-react", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
  useAppBridge: () => ({
    dispatch: vi.fn(),
  }),
  TitleBar: ({ title }: { title: string }) =>
    React.createElement("div", { "data-testid": "title-bar" }, title),
  Loading: ({ loading }: { loading: boolean }) =>
    loading ? React.createElement("div", { "data-testid": "loading" }) : null,
}));

// Mock Shopify Storefront API
vi.mock("@shopify/storefront-api-client", () => ({
  createStorefrontApiClient: vi.fn(() => ({
    request: vi.fn(),
  })),
}));
