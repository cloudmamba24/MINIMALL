import type { NextConfig } from 'next';

/**
 * Shared Next.js configuration for all apps
 */
export const createNextConfig = (appConfig: Partial<NextConfig> = {}): NextConfig => {
  const baseConfig: NextConfig = {
    // Performance optimizations
    experimental: {
      optimizeCss: true,
    },
    
    // Image optimization
    images: {
      domains: ['cdn.shopify.com', 'shopify.com'],
      formats: ['image/avif', 'image/webp'],
    },
    
    // Security headers (shared across all apps)
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on',
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains',
            },
          ],
        },
      ];
    },
    
    // Webpack config for all apps
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          crypto: false,
        };
      }
      
      // Suppress common warnings
      config.ignoreWarnings = [
        {
          module: /@opentelemetry\/instrumentation/,
          message: /Critical dependency/,
        },
        {
          module: /@prisma\/instrumentation/,
          message: /Critical dependency/,
        },
      ];
      
      return config;
    },
    
    // Shared transpile packages
    transpilePackages: [
      '@minimall/core',
      '@minimall/ui',
      '@minimall/db',
      '@minimall/types',
      '@minimall/webhooks',
      '@minimall/api',
    ],
  };
  
  // Merge with app-specific config
  return {
    ...baseConfig,
    ...appConfig,
    headers: async () => {
      const baseHeaders = await baseConfig.headers?.() || [];
      const appHeaders = await appConfig.headers?.() || [];
      return [...baseHeaders, ...appHeaders];
    },
    webpack: (config, options) => {
      let finalConfig = baseConfig.webpack?.(config, options) || config;
      if (appConfig.webpack) {
        finalConfig = appConfig.webpack(finalConfig, options);
      }
      return finalConfig;
    },
  };
};