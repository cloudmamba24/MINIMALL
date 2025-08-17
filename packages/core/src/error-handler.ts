/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

import * as Sentry from "@sentry/nextjs";

export enum ErrorSeverity {
	LOW = "low",
	MEDIUM = "medium",
	HIGH = "high",
	CRITICAL = "critical",
}

export interface ErrorContext {
	component?: string;
	action?: string;
	userId?: string;
	shopDomain?: string;
	metadata?: Record<string, unknown>;
}

export class AppError extends Error {
	public readonly severity: ErrorSeverity;
	public readonly context?: ErrorContext;
	public readonly statusCode?: number;
	public readonly isOperational: boolean;

	constructor(
		message: string,
		severity: ErrorSeverity = ErrorSeverity.MEDIUM,
		statusCode?: number,
		context?: ErrorContext,
		isOperational = true,
	) {
		super(message);
		this.name = this.constructor.name;
		this.severity = severity;
		this.statusCode = statusCode;
		this.context = context;
		this.isOperational = isOperational;
		Error.captureStackTrace(this, this.constructor);
	}
}

export class ValidationError extends AppError {
	constructor(message: string, context?: ErrorContext) {
		super(message, ErrorSeverity.LOW, 400, context);
	}
}

export class AuthenticationError extends AppError {
	constructor(message: string, context?: ErrorContext) {
		super(message, ErrorSeverity.MEDIUM, 401, context);
	}
}

export class AuthorizationError extends AppError {
	constructor(message: string, context?: ErrorContext) {
		super(message, ErrorSeverity.MEDIUM, 403, context);
	}
}

export class NotFoundError extends AppError {
	constructor(message: string, context?: ErrorContext) {
		super(message, ErrorSeverity.LOW, 404, context);
	}
}

export class ConflictError extends AppError {
	constructor(message: string, context?: ErrorContext) {
		super(message, ErrorSeverity.LOW, 409, context);
	}
}

export class RateLimitError extends AppError {
	constructor(message: string, context?: ErrorContext) {
		super(message, ErrorSeverity.LOW, 429, context);
	}
}

export class DatabaseError extends AppError {
	constructor(message: string, context?: ErrorContext) {
		super(message, ErrorSeverity.HIGH, 500, context, false);
	}
}

export class ExternalServiceError extends AppError {
	constructor(service: string, message: string, context?: ErrorContext) {
		super(`${service}: ${message}`, ErrorSeverity.MEDIUM, 502, context);
	}
}

/**
 * Central error handler that replaces console.error
 */
export function handleError(
	error: unknown,
	context?: ErrorContext,
	additionalData?: Record<string, unknown>,
): void {
	// Convert unknown errors to Error objects
	const err = error instanceof Error ? error : new Error(String(error));

	// Determine severity
	const severity =
		err instanceof AppError ? err.severity : ErrorSeverity.MEDIUM;

	// In development, log to console for debugging
	if (process.env.NODE_ENV === "development") {
		console.error("Error:", {
			message: err.message,
			stack: err.stack,
			context,
			additionalData,
		});
	}

	// Send to Sentry for production monitoring
	if (process.env.NODE_ENV === "production" || process.env.SENTRY_DSN) {
		Sentry.withScope((scope) => {
			// Set severity level
			scope.setLevel(mapSeverityToSentryLevel(severity));

			// Add context
			if (context) {
				scope.setContext("error_context", context as Record<string, any>);
				if (context.userId) scope.setUser({ id: context.userId });
				if (context.shopDomain) scope.setTag("shop_domain", context.shopDomain);
				if (context.component) scope.setTag("component", context.component);
				if (context.action) scope.setTag("action", context.action);
			}

			// Add additional data
			if (additionalData) {
				scope.setContext("additional_data", additionalData);
			}

			// Capture the error
			Sentry.captureException(err);
		});
	}

	// For non-operational errors, we might want to crash the process
	if (err instanceof AppError && !err.isOperational) {
		process.exit(1);
	}
}

/**
 * Async error handler wrapper for route handlers
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	context?: ErrorContext,
): T {
	return (async (...args: Parameters<T>) => {
		try {
			return await fn(...args);
		} catch (error) {
			handleError(error, context);
			throw error;
		}
	}) as T;
}

/**
 * Safe execution wrapper that returns a Result type
 */
export type Result<T, E = Error> =
	| { success: true; data: T }
	| { success: false; error: E };

export async function safeExecute<T>(
	fn: () => Promise<T>,
	context?: ErrorContext,
): Promise<Result<T>> {
	try {
		const data = await fn();
		return { success: true, data };
	} catch (error) {
		handleError(error, context);
		return {
			success: false,
			error: error instanceof Error ? error : new Error(String(error)),
		};
	}
}

/**
 * Map our severity levels to Sentry severity levels
 */
function mapSeverityToSentryLevel(
	severity: ErrorSeverity,
): Sentry.SeverityLevel {
	switch (severity) {
		case ErrorSeverity.LOW:
			return "info";
		case ErrorSeverity.MEDIUM:
			return "warning";
		case ErrorSeverity.HIGH:
			return "error";
		case ErrorSeverity.CRITICAL:
			return "fatal";
		default:
			return "error";
	}
}

/**
 * Express/Next.js error middleware
 */
export function errorMiddleware(
	err: Error,
	_req: any,
	res: any,
	_next: any,
): void {
	handleError(err, { component: "api-middleware" });

	const statusCode = err instanceof AppError ? err.statusCode || 500 : 500;
	const message =
		process.env.NODE_ENV === "production"
			? "An error occurred processing your request"
			: err.message;

	res.status(statusCode).json({
		error: {
			message,
			statusCode,
			...(process.env.NODE_ENV === "development" && { stack: err.stack }),
		},
	});
}

export default {
	handleError,
	asyncHandler,
	safeExecute,
	AppError,
	ValidationError,
	AuthenticationError,
	AuthorizationError,
	NotFoundError,
	ConflictError,
	RateLimitError,
	DatabaseError,
	ExternalServiceError,
	errorMiddleware,
};
