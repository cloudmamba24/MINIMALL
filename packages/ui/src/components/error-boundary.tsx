import * as Sentry from "@sentry/react";
import type React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
        <svg
          className="w-6 h-6 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Error"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <div className="mt-3 text-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Something went wrong</h3>
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            We've been notified of this issue and will look into it.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <div className="mt-5">
          <button
            type="button"
            onClick={resetError}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  </div>
);

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback: FallbackComponent = DefaultErrorFallback,
  onError,
}) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <FallbackComponent error={error as Error} resetError={resetError} />
      )}
      beforeCapture={(scope, error) => {
        // Add additional context to Sentry
        scope.setTag("errorBoundary", true);
        scope.setLevel("error");

        // Call custom error handler if provided
        if (error instanceof Error && onError) {
          onError(error, { componentStack: "" });
        }
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback || DefaultErrorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Specific error fallbacks for different components
export const PageErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
    <div className="text-center space-y-4 max-w-lg px-4">
      <h1 className="text-4xl font-bold text-destructive">Oops!</h1>
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">
        We encountered an error while loading this page. Don't worry, we've been notified and will
        fix it soon.
      </p>

      {process.env.NODE_ENV === "development" && (
        <details className="text-left bg-destructive/5 rounded-lg p-4">
          <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
          <pre className="mt-2 text-xs overflow-auto whitespace-pre-wrap">
            {error.message}
            {"\n\n"}
            {error.stack}
          </pre>
        </details>
      )}

      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={resetError}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-md font-medium"
        >
          Go home
        </button>
      </div>
    </div>
  </div>
);

export const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <svg
          className="h-5 w-5 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Error"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-destructive">Component Error</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This component failed to load properly.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-destructive mt-2 font-mono">{error.message}</p>
        )}
        <button
          type="button"
          onClick={resetError}
          className="text-xs underline text-destructive hover:no-underline mt-2"
        >
          Try again
        </button>
      </div>
    </div>
  </div>
);
