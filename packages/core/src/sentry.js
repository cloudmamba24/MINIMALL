import * as Sentry from "@sentry/nextjs";
/**
 * Create Sentry configuration for Next.js applications
 */
export function createSentryConfig(config) {
    const { dsn = process.env.NEXT_PUBLIC_SENTRY_DSN, environment = process.env.NODE_ENV, tracesSampleRate = environment === "production" ? 0.1 : 1.0, enableInDevelopment = false, enableReplays = true, replaysSessionSampleRate = 0.1, replaysOnErrorSampleRate = 1.0, beforeSend, integrations = [], tags = {}, component, } = config;
    return {
        dsn,
        environment,
        tracesSampleRate,
        debug: environment === "development",
        beforeSend: (event) => {
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
            ...(enableReplays
                ? [
                    Sentry.replayIntegration({
                        maskAllText: false,
                        blockAllMedia: false,
                    }),
                ]
                : []),
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
export function createClientConfig(overrides = {}) {
    return createSentryConfig({
        component: "client",
        enableReplays: true,
        ...overrides,
    });
}
/**
 * Server-side Sentry configuration factory
 */
export function createServerConfig(overrides = {}) {
    return createSentryConfig({
        component: "server",
        enableReplays: false,
        ...overrides,
    });
}
/**
 * Edge runtime Sentry configuration factory
 */
export function createEdgeConfig(overrides = {}) {
    return createSentryConfig({
        component: "edge",
        enableReplays: false,
        tracesSampleRate: 0.1, // Lower sample rate for edge
        ...overrides,
    });
}
//# sourceMappingURL=sentry.js.map