/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Server Components and experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable optimizations
    optimizeCss: true,
  },
  
  // External packages that should not be bundled (removed core and db from transpilePackages)
  
  // Turbopack configuration (moved from experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [
      'cdn.shopify.com',
      'shopify.com',
      // Cloudflare R2 domain will be added from env
      process.env.R2_DOMAIN || '',
    ].filter(Boolean),
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // CSP for edge performance and security
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://cdn.shopify.com https://images.unsplash.com",
              "font-src 'self'",
              "connect-src 'self' https://*.shopify.com https://*.r2.cloudflarestorage.com https://vercel.live",
              "frame-ancestors 'none'",
            ].join('; ')
          }
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          // Edge function specific headers
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=86400'
          }
        ],
      },
      {
        source: '/g/:path*',
        headers: [
          // Site pages with aggressive caching
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=3600'
          }
        ],
      }
    ];
  },

  // Webpack configuration for edge runtime optimization
  webpack: (config, { isServer, dev }) => {
    if (!dev && isServer) {
      // Optimize for edge runtime
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
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

  // Enable static optimization
  trailingSlash: false,
  
  // Transpile packages - only include packages that are actually used in public app
  transpilePackages: ['@minimall/core', '@minimall/ui'],
  
  // Remove output configuration - let Vercel handle it
  // output: 'standalone',
};

module.exports = nextConfig;