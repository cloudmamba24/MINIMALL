import * as Sentry from "@sentry/nextjs";

export interface SentryConfig {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: number;
  enableInDevelopment?: boolean;
  enableReplays?: boolean;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  beforeSend?: (event: any) => any;
  integrations?: any[];
  tags?: Record<string, string>;
}

/**
 * Create Sentry configuration for Next.js applications
 */
export function createSentryConfig(config: SentryConfig & { component: string }) {
  const {
    dsn = process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment = process.env.NODE_ENV,
    tracesSampleRate = environment === "production" ? 0.1 : 1.0,
    enableInDevelopment = false,
    enableReplays = true,
    replaysSessionSampleRate = 0.1,
    replaysOnErrorSampleRate = 1.0,
    beforeSend,
    integrations = [],
    tags = {},
    component,
  } = config;

  return {
    dsn,
    environment,
    tracesSampleRate,
    debug: environment === "development",

    beforeSend: (event: any) => {
      // Don't send events in development unless explicitly enabled
      if (environment === "development" && !enableInDevelopment) {
        return null;
      }

      // Apply custom beforeSend logic
      if (beforeSend) {
        return beforeSend(event);
      }

      return event;
    },

    integrations: [
      // Replay integration temporarily disabled for compatibility
      // ...(enableReplays
      //   ? [
      //       Sentry.replayIntegration({
      //         maskAllText: false,
      //         blockAllMedia: false,
      //       }),
      //     ]
      //   : []),
      ...integrations,
    ],

    // Replay configuration
    ...(enableReplays && {
      replaysSessionSampleRate,
      replaysOnErrorSampleRate,
    }),

    // Initial scope configuration
    initialScope: {
      tags: {
        component,
        ...tags,
      },
    },
  };
}

/**
 * Client-side Sentry configuration factory
 */
export function createClientConfig(overrides: Partial<SentryConfig> = {}): SentryConfig {
  const baseConfig = createSentryConfig({
    component: "client",
    enableReplays: true,
    ...overrides,
  });
  
  // Ensure DSN is provided for client-side configuration
  if (!baseConfig.dsn) {
    console.warn('Sentry DSN not provided. Sentry will be disabled.');
    return { ...baseConfig, dsn: '', beforeSend: () => null } as SentryConfig;
  }
  
  return { ...baseConfig, dsn: baseConfig.dsn } as SentryConfig;
}

/**
 * Server-side Sentry configuration factory
 */
export function createServerConfig(overrides: Partial<SentryConfig> = {}): SentryConfig {
  const baseConfig = createSentryConfig({
    component: "server",
    enableReplays: false,
    ...overrides,
  });
  
  // Ensure DSN is provided for server-side configuration
  if (!baseConfig.dsn) {
    console.warn('Sentry DSN not provided. Sentry will be disabled.');
    return { ...baseConfig, dsn: '', beforeSend: () => null } as SentryConfig;
  }
  
  return { ...baseConfig, dsn: baseConfig.dsn } as SentryConfig;
}

/**
 * Edge runtime Sentry configuration factory
 */
export function createEdgeConfig(overrides: Partial<SentryConfig> = {}): SentryConfig {
  const baseConfig = createSentryConfig({
    component: "edge",
    enableReplays: false,
    tracesSampleRate: 0.1, // Lower sample rate for edge
    ...overrides,
  });
  
  // Ensure DSN is provided for edge runtime configuration
  if (!baseConfig.dsn) {
    console.warn('Sentry DSN not provided. Sentry will be disabled.');
    return { ...baseConfig, dsn: '', beforeSend: () => null } as SentryConfig;
  }
  
  return { ...baseConfig, dsn: baseConfig.dsn } as SentryConfig;
}
