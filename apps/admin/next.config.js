/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Pages Router for Shopify App Bridge compatibility
  experimental: {
    // Enable optimizations compatible with Pages Router
    optimizeCss: true,
  },

  // Force Node.js runtime for API routes that use crypto
  // (required for Shopify authentication)
  serverExternalPackages: ["crypto"],

  // External packages that should not be bundled (removed core and db from transpilePackages)

  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // Transpile Shopify packages
  transpilePackages: [
    "@shopify/polaris",
    "@shopify/app-bridge",
    "@shopify/app-bridge-react",
    "@minimall/core",
    "@minimall/ui",
    "@minimall/db",
  ],

  // Headers for embedded app security
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Required for Shopify iframe embedding
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors https://*.myshopify.com https://admin.shopify.com",
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com",
              "style-src 'self' 'unsafe-inline' https://cdn.shopify.com",
              "img-src 'self' data: https://cdn.shopify.com",
              "connect-src 'self' https://*.shopify.com https://*.myshopify.com",
            ].join("; "),
          },
          // CORS for API routes (will be handled dynamically in API routes)
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },

  // Image optimization for admin assets
  images: {
    domains: ["cdn.shopify.com", "shopify.com"],
  },

  // Environment variables for client-side
  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Shopify Polaris compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        "node:crypto": false,
      };
    }

    // Suppress OpenTelemetry/Prisma instrumentation warnings
    config.ignoreWarnings = [
      {
        module: /@opentelemetry\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
      {
        module: /@prisma\/instrumentation/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },

  // Static optimization
  trailingSlash: false,

  // Remove output configuration - let Vercel handle it
  // output: "standalone",

  // Development configuration
  ...(process.env.NODE_ENV === "development" && {
    rewrites: async () => {
      return [
        {
          source: "/api/:path*",
          destination: "/api/:path*",
        },
      ];
    },
  }),
};

module.exports = nextConfig;
