// Error handling utilities from our debugging documentation

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: unknown;
  errorBoundaryName?: string;
  errorBoundaryFound: boolean;
  errorBoundaryStack?: string;
}

export interface ErrorBoundaryError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  stack?: string;
  userId?: string;
  configId?: string;
  requestId?: string;
}

// Error logging utility following our debugging patterns
export const logError = (error: Error, context?: Record<string, unknown>) => {
  const errorData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "unknown",
    timestamp: new Date().toISOString(),
  };

  console.error("🚨 Application Error:", errorData);

  // Send to error tracking service (Sentry, LogRocket, etc.)
  if (
    typeof window !== "undefined" &&
    (
      window as unknown as {
        Sentry?: { captureException: (e: Error, opts?: unknown) => void };
      }
    ).Sentry
  ) {
    (
      window as unknown as {
        Sentry: { captureException: (e: Error, opts?: unknown) => void };
      }
    ).Sentry.captureException(error, {
      extra: context,
      tags: {
        section: "application-error",
      },
    });
  }

  // Send to your own logging service
  if (typeof window !== "undefined") {
    fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorData),
    }).catch(console.error);
  }
};

// Error handler for async operations
export const handleAsyncError = async <T>(
  operation: () => Promise<T>,
  fallback?: T,
  context?: Record<string, any>
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    logError(error as Error, context);

    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
};

// Safe error handler that never throws
export const safeErrorHandler = <T>(
  operation: () => T,
  fallback: T,
  context?: Record<string, any>
): T => {
  try {
    return operation();
  } catch (error) {
    logError(error as Error, context);
    return fallback;
  }
};

// Create structured error
export const createErrorBoundaryError = (
  code: string,
  message: string,
  details?: unknown,
  requestId?: string
): ErrorBoundaryError => ({
  code,
  message,
  details,
  timestamp: new Date(),
  requestId,
});

// Error classification
export const classifyError = (error: Error): string => {
  if (error.name === "TypeError") return "TYPE_ERROR";
  if (error.name === "ReferenceError") return "REFERENCE_ERROR";
  if (error.name === "NetworkError") return "NETWORK_ERROR";
  if (error.message.includes("fetch")) return "FETCH_ERROR";
  if (error.message.includes("database")) return "DATABASE_ERROR";
  if (error.message.includes("auth")) return "AUTH_ERROR";
  return "UNKNOWN_ERROR";
};

// Error recovery strategies
export const errorRecoveryStrategies = {
  NETWORK_ERROR: () => {
    console.log("🔄 Retrying network operation...");
    // Implement retry logic
  },

  DATABASE_ERROR: () => {
    console.log("💾 Falling back to cache or demo data...");
    // Implement database fallback
  },

  AUTH_ERROR: () => {
    console.log("🔐 Redirecting to authentication...");
    // Implement auth recovery
  },

  UNKNOWN_ERROR: () => {
    console.log("⚠️ Generic error recovery...");
    // Implement generic recovery
  },
};
