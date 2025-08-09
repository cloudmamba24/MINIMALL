// Next.js Pages Router mocks (for admin app)
vi.mock("next/router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    reload: vi.fn(),
    query: {},
    pathname: "/admin",
    route: "/admin",
    asPath: "/admin",
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    beforePopState: vi.fn(),
    prefetch: vi.fn(() => Promise.resolve()),
    isReady: true,
    isFallback: false,
    isPreview: false,
  }),
}));

// Mock next/head
vi.mock("next/head", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock next/link
vi.mock("next/link", () => {
  return {
    __esModule: true,
    default: ({ children, href, ...props }: any) =>
      React.createElement("a", { href, ...props }, children),
  };
});

// Mock next/image
vi.mock("next/image", () => {
  return {
    __esModule: true,
    default: (props: any) => React.createElement("img", props),
  };
});
