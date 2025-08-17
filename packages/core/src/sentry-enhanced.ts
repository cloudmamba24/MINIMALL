/**
 * Enhanced Sentry Configuration with Production-Ready Settings
 */

import * as Sentry from "@sentry/nextjs";

// Global context for enriching errors
declare global {
  var currentUser: { id: string; email: string } | undefined;
  var currentShop: string | undefined;
}

/**
 * Initialize Sentry with enhanced configuration
 */
export function initSentryEnhanced() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!dsn) {
    if (process.env.NODE_ENV === "production") {
      console.warn("⚠️ Sentry DSN not configured for production environment");
      console.warn("Set SENTRY_DSN in your environment variables to enable error tracking");
    }
    return;
  }

  Sentry.init({
    dsn,

    // Environment configuration
    environment: process.env.NODE_ENV || "development",

    // Release tracking for better error grouping
    release:
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      process.env.npm_package_version ||
      "unknown",

    // Performance Monitoring
    tracesSampleRate: getSampleRate(),
    profilesSampleRate: getSampleRate(),

    // Integrations are automatically included in @sentry/nextjs v8+

    // Breadcrumb configuration
    maxBreadcrumbs: 50,

    // Before send hook for filtering and enrichment
    beforeSend(event, hint) {
      // Skip in development unless debugging
      if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG) {
        return null;
      }

      // Enrich with user context
      if (!event.user && global.currentUser) {
        event.user = {
          id: global.currentUser.id,
          email: global.currentUser.email,
        };
      }

      // Add shop context for Shopify apps
      if (global.currentShop) {
        event.tags = {
          ...event.tags,
          shop_domain: global.currentShop,
        };
      }

      // Add deployment context
      event.tags = {
        ...event.tags,
        deployment: process.env.VERCEL_ENV || "local",
        region: process.env.VERCEL_REGION || "unknown",
      };

      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error && error instanceof Error) {
        // Skip network errors in development
        if (error.message?.includes("ECONNREFUSED") && process.env.NODE_ENV !== "production") {
          return null;
        }

        // Skip abort errors from cancelled requests
        if (error.name === "AbortError") {
          return null;
        }

        // Skip Next.js hydration errors in development
        if (error.message?.includes("Hydration") && process.env.NODE_ENV !== "production") {
          return null;
        }
      }

      // Add error classification
      classifyError(event, error);

      return event;
    },

    // Before breadcrumb hook
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
        return null;
      }

      // Sanitize sensitive data from breadcrumbs
      if (breadcrumb.data) {
        breadcrumb.data = sanitizeData(breadcrumb.data);
      }

      return breadcrumb;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      // Network errors
      "NetworkError",
      "Failed to fetch",
      // Safari specific
      "AbortError: Fetch is aborted",
    ],

    // Deny URLs - don't track errors from these
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
      // Safari extensions
      /^safari-extension:\/\//i,
    ],
  });

  // Set up global error handlers
  setupGlobalErrorHandlers();

  // Log successful initialization
  console.log(`✅ Sentry initialized for ${process.env.NODE_ENV} environment`);

  // Set initial context
  setInitialContext();
}

/**
 * Get sample rate based on environment
 */
function getSampleRate(): number {
  if (process.env.SENTRY_SAMPLE_RATE) {
    return Number.parseFloat(process.env.SENTRY_SAMPLE_RATE);
  }

  switch (process.env.NODE_ENV) {
    case "production":
      return 0.1; // 10% in production
    case "staging" as any:
      return 0.5; // 50% in staging
    default:
      return 1.0; // 100% in development
  }
}

/**
 * Classify errors for better grouping
 */
function classifyError(event: any, error: unknown): void {
  if (!event.tags) event.tags = {};

  if (error instanceof Error) {
    // Database errors
    if (error.message?.includes("DATABASE") || error.message?.includes("POSTGRES")) {
      event.tags.error_category = "database";
      event.level = "error";
    }
    // API errors
    else if (error.message?.includes("API") || error.message?.includes("fetch")) {
      event.tags.error_category = "api";
      event.level = "warning";
    }
    // Validation errors
    else if (error.name?.includes("Validation") || error.message?.includes("validation")) {
      event.tags.error_category = "validation";
      event.level = "warning";
    }
    // Auth errors
    else if (error.message?.includes("auth") || error.message?.includes("permission")) {
      event.tags.error_category = "auth";
      event.level = "warning";
    }
  }
}

/**
 * Sanitize sensitive data
 */
function sanitizeData(data: any): any {
  if (typeof data !== "object" || data === null) return data;

  const sanitized = { ...data };
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "api_key",
    "apiKey",
    "authorization",
    "cookie",
    "session",
    "credit_card",
  ];

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Set up global error handlers
 */
function setupGlobalErrorHandlers(): void {
  if (typeof window !== "undefined") {
    // Browser environment
    window.addEventListener("unhandledrejection", (event) => {
      Sentry.captureException(event.reason, {
        tags: { error_type: "unhandled_rejection" },
        level: "error",
      });
    });

    // Track client-side performance
    if (window.performance && window.performance.timing) {
      const navTiming = window.performance.timing;
      const pageLoadTime = navTiming.loadEventEnd - navTiming.navigationStart;

      Sentry.addBreadcrumb({
        category: "navigation",
        message: "Page load performance",
        level: "info",
        data: { pageLoadTime },
      });
    }
  } else {
    // Node.js environment
    process.on("unhandledRejection", (reason) => {
      Sentry.captureException(reason, {
        tags: { error_type: "unhandled_rejection" },
        level: "error",
      });
    });

    process.on("uncaughtException", (error) => {
      Sentry.captureException(error, {
        tags: { error_type: "uncaught_exception" },
        level: "fatal",
      });

      // Give Sentry time to send the error before crashing
      Sentry.flush(2000).then(() => {
        process.exit(1);
      });
    });
  }
}

/**
 * Set initial context for all errors
 */
function setInitialContext(): void {
  Sentry.setContext("runtime", {
    node_version: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
  });

  // Set app version
  if (process.env.npm_package_version) {
    Sentry.setTag("app_version", process.env.npm_package_version);
  }
}

/**
 * Helper to capture exceptions with context
 */
export function captureException(error: unknown, context?: any): string {
  return Sentry.captureException(error, {
    ...context,
    fingerprint: context?.fingerprint || ["{{ default }}"],
  });
}

/**
 * Helper to add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category = "custom",
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data: data ? sanitizeData(data) : undefined,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (user) {
    global.currentUser = { id: user.id, email: user.email || "" };
    Sentry.setUser(user);
  } else {
    global.currentUser = undefined;
    Sentry.setUser(null);
  }
}

/**
 * Set shop context (for Shopify apps)
 */
export function setShopContext(shopDomain: string | null): void {
  if (shopDomain) {
    global.currentShop = shopDomain;
    Sentry.setTag("shop_domain", shopDomain);
  } else {
    global.currentShop = undefined;
    Sentry.setTag("shop_domain", undefined);
  }
}

/**
 * Performance monitoring helper
 */
export function startTransaction(name: string, op = "navigation"): any {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    (span) => {
      span.setAttribute("component", typeof window !== "undefined" ? "client" : "server");
      return span;
    }
  );
}

/**
 * Flush all pending events
 */
export async function flush(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

export default {
  initSentryEnhanced,
  captureException,
  addBreadcrumb,
  setUser,
  setShopContext,
  startTransaction,
  flush,
};
