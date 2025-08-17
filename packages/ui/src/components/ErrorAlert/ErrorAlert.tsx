import React from "react";
import { AlertCircle, X, RefreshCw, Settings } from "lucide-react";

interface ErrorAlertProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  onConfigure?: () => void;
  type?: "error" | "warning" | "info";
  className?: string;
}

export function ErrorAlert({
  title = "Error",
  message,
  details,
  onRetry,
  onDismiss,
  onConfigure,
  type = "error",
  className = "",
}: ErrorAlertProps) {
  const bgColor = {
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  }[type];

  const iconColor = {
    error: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  }[type];

  const titleColor = {
    error: "text-red-900",
    warning: "text-yellow-900",
    info: "text-blue-900",
  }[type];

  const textColor = {
    error: "text-red-700",
    warning: "text-yellow-700",
    info: "text-blue-700",
  }[type];

  return (
    <div className={`${bgColor} border rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${titleColor}`}>{title}</h3>
          <div className={`mt-2 text-sm ${textColor}`}>
            <p>{message}</p>
            {details && (
              <details className="mt-2">
                <summary className="cursor-pointer hover:underline">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                  {details}
                </pre>
              </details>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full ${textColor} bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600`}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </button>
            )}
            {onConfigure && (
              <button
                type="button"
                onClick={onConfigure}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full ${textColor} bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600`}
              >
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 ${textColor} hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600`}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}