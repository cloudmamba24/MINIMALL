// Next.js App Router mocks (for public app)
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/test",
  useParams: () => ({}),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: () => new Map(),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Mock Server Actions
vi.mock("server-only", () => ({}));

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
