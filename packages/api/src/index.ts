import type { ApiError, ApiResponse, AuthUser } from "@minimall/types";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import type { z } from "zod";

/**
 * API Handler wrapper with automatic error handling, validation, and auth
 */
export function createApiHandler<TBody = any, TQuery = any, TParams = any>(
  config: ApiHandlerConfig<TBody, TQuery, TParams>
) {
  return async (
    request: NextRequest,
    context?: { params?: Record<string, string> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();

    try {
      // Auth check
      if (config.auth !== false) {
        const authResult = await authenticate(request, config.auth);
        if (!authResult.success) {
          return createErrorResponse(authResult.error!);
        }
        request.user = authResult.user;
      }

      // Rate limiting
      if (config.rateLimit) {
        const rateLimitResult = checkRateLimit(request, config.rateLimit);
        if (!rateLimitResult.success) {
          return createErrorResponse(rateLimitResult.error!);
        }
      }

      // Parse and validate inputs
      const { body, query, params } = await parseInputs(
        request,
        context?.params || {},
        config.validation
      );

      // Call handler
      const result = await config.handler({
        request,
        body,
        query,
        params,
        user: request.user,
      });

      // Log success
      if (config.logging !== false) {
        logApiCall({
          method: request.method,
          path: request.url,
          duration: Date.now() - startTime,
          status: "success",
          user: request.user,
        });
      }

      return createSuccessResponse(result);
    } catch (error) {
      // Log error
      if (config.logging !== false) {
        logApiCall({
          method: request.method,
          path: request.url,
          duration: Date.now() - startTime,
          status: "error",
          error,
          user: request.user,
        });
      }

      // Handle error
      return handleApiError(error);
    }
  };
}

interface ApiHandlerConfig<TBody, TQuery, TParams> {
  auth?: AuthConfig | false;
  rateLimit?: RateLimitConfig;
  validation?: {
    body?: z.ZodSchema<TBody>;
    query?: z.ZodSchema<TQuery>;
    params?: z.ZodSchema<TParams>;
  };
  logging?: boolean;
  handler: (context: HandlerContext<TBody, TQuery, TParams>) => Promise<any>;
}

interface HandlerContext<TBody, TQuery, TParams> {
  request: NextRequest & { user?: AuthUser };
  body?: TBody;
  query?: TQuery;
  params?: TParams;
  user?: AuthUser;
}

type AuthConfig = {
  type?: "session" | "bearer" | "apiKey";
  scopes?: string[];
};

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Authentication middleware
 */
async function authenticate(
  request: NextRequest,
  config: AuthConfig = {}
): Promise<{ success: boolean; user?: AuthUser; error?: ApiError }> {
  const { type = "session", scopes = [] } = config;

  try {
    const user: AuthUser | null = null;

    switch (type) {
      case "session": {
        const sessionToken = request.cookies.get("shopify_session")?.value;
        if (!sessionToken) {
          return {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "No session found",
              statusCode: 401,
            },
          };
        }
        // Validate session and get user
        // user = await validateSession(sessionToken);
        break;
      }

      case "bearer": {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid authorization header",
              statusCode: 401,
            },
          };
        }
        // const token = authHeader.substring(7);
        // Validate bearer token
        // user = await validateBearerToken(token);
        break;
      }

      case "apiKey": {
        const apiKey = request.headers.get("x-api-key");
        if (!apiKey) {
          return {
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "API key required",
              statusCode: 401,
            },
          };
        }
        // Validate API key
        // user = await validateApiKey(apiKey);
        break;
      }
    }

    if (!user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication failed",
          statusCode: 401,
        },
      };
    }

    // Check scopes
    if (scopes.length > 0 && user && 'scope' in user) {
      const userScopes = (user as any).scope;
      const hasRequiredScopes = scopes.every((scope) => userScopes.includes(scope));
      if (!hasRequiredScopes) {
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions",
            statusCode: 403,
          },
        };
      }
    }

    return { success: true, user };
  } catch (error) {
    Sentry.captureException(error);
    return {
      success: false,
      error: {
        code: "AUTH_ERROR",
        message: "Authentication error",
        statusCode: 500,
      },
    };
  }
}

/**
 * Rate limiting
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { success: boolean; error?: ApiError } {
  const identifier =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { success: true };
  }

  if (record.count >= config.maxRequests) {
    return {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests",
        statusCode: 429,
      },
    };
  }

  record.count++;
  return { success: true };
}

/**
 * Parse and validate request inputs
 */
async function parseInputs<TBody, TQuery, TParams>(
  request: NextRequest,
  params: Record<string, string>,
  validation?: {
    body?: z.ZodSchema<TBody>;
    query?: z.ZodSchema<TQuery>;
    params?: z.ZodSchema<TParams>;
  }
): Promise<{ body?: TBody; query?: TQuery; params?: TParams }> {
  const result: any = {};

  // Parse body
  if (validation?.body && ["POST", "PUT", "PATCH"].includes(request.method)) {
    const rawBody = await request.json();
    const parsed = validation.body.safeParse(rawBody);
    if (!parsed.success) {
      throw new ValidationError("Invalid request body", parsed.error);
    }
    result.body = parsed.data;
  }

  // Parse query
  if (validation?.query) {
    const query = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = validation.query.safeParse(query);
    if (!parsed.success) {
      throw new ValidationError("Invalid query parameters", parsed.error);
    }
    result.query = parsed.data;
  }

  // Parse params
  if (validation?.params) {
    const parsed = validation.params.safeParse(params);
    if (!parsed.success) {
      throw new ValidationError("Invalid path parameters", parsed.error);
    }
    result.params = parsed.data;
  }

  return result;
}

/**
 * Create success response
 */
function createSuccessResponse(data: any): NextResponse {
  const response: ApiResponse = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  };

  return NextResponse.json(response);
}

/**
 * Create error response
 */
function createErrorResponse(error: ApiError): NextResponse {
  const response: ApiResponse = {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  };

  return NextResponse.json(response, { status: error.statusCode || 500 });
}

/**
 * Handle API errors
 */
function handleApiError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return createErrorResponse({
      code: "VALIDATION_ERROR",
      message: error.message,
      details: error.errors,
      statusCode: 400,
    });
  }

  if (error instanceof ApiException) {
    return createErrorResponse({
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    });
  }

  // Log unexpected errors
  Sentry.captureException(error);

  return createErrorResponse({
    code: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    statusCode: 500,
  });
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ApiException extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 500
  ) {
    super(message);
    this.name = "ApiException";
  }
}

/**
 * Log API calls
 */
function logApiCall(data: any): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[API]", data);
  }

  // Send to monitoring service
  Sentry.addBreadcrumb({
    category: "api",
    message: `${data.method} ${data.path}`,
    level: data.status === "error" ? "error" : "info",
    data,
  });
}

// Extend NextRequest type
declare module "next/server" {
  interface NextRequest {
    user?: AuthUser;
  }
}

export * from "./routes";
export * from "./validators";
