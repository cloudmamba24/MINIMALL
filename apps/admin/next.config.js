/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },

  serverExternalPackages: ["crypto"],

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  transpilePackages: [
    "@minimall/core",
    "@minimall/ui",
    "@minimall/db",
  ],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "frame-ancestors https://*.myshopify.com https://admin.shopify.com",
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com",
              "style-src 'self' 'unsafe-inline' https://cdn.shopify.com https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.shopify.com https://*.myshopify.com",
            ].join("; "),
          },
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

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  env: {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        "node:crypto": false,
      };
    }

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

  trailingSlash: false,

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