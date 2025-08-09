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
export declare function createSentryConfig(config: SentryConfig & {
    component: string;
}): {
    initialScope: {
        tags: {
            component: string;
        };
    };
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    dsn: string | undefined;
    environment: string;
    tracesSampleRate: number;
    debug: boolean;
    beforeSend: (event: any) => any;
    integrations: any[];
};
/**
 * Client-side Sentry configuration factory
 */
export declare function createClientConfig(overrides?: Partial<SentryConfig>): {
    initialScope: {
        tags: {
            component: string;
        };
    };
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    dsn: string | undefined;
    environment: string;
    tracesSampleRate: number;
    debug: boolean;
    beforeSend: (event: any) => any;
    integrations: any[];
};
/**
 * Server-side Sentry configuration factory
 */
export declare function createServerConfig(overrides?: Partial<SentryConfig>): {
    initialScope: {
        tags: {
            component: string;
        };
    };
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    dsn: string | undefined;
    environment: string;
    tracesSampleRate: number;
    debug: boolean;
    beforeSend: (event: any) => any;
    integrations: any[];
};
/**
 * Edge runtime Sentry configuration factory
 */
export declare function createEdgeConfig(overrides?: Partial<SentryConfig>): {
    initialScope: {
        tags: {
            component: string;
        };
    };
    replaysSessionSampleRate?: number;
    replaysOnErrorSampleRate?: number;
    dsn: string | undefined;
    environment: string;
    tracesSampleRate: number;
    debug: boolean;
    beforeSend: (event: any) => any;
    integrations: any[];
};
//# sourceMappingURL=sentry.d.ts.map