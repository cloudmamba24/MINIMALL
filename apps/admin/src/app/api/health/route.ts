import { getDatabaseConnection, getDatabaseStatus } from "@minimall/db";
import { getR2Service } from "@minimall/core";
import { type NextRequest, NextResponse } from "next/server";

interface HealthCheckResult {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  message: string;
  details?: any;
}

interface HealthResponse {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  services: HealthCheckResult[];
  environment: {
    nodeEnv: string;
    isProduction: boolean;
  };
}

async function checkDatabase(): Promise<HealthCheckResult> {
  try {
    const db = getDatabaseConnection();
    if (!db) {
      return {
        service: "database",
        status: "unhealthy",
        message: "Database connection not available",
        details: {
          configured: !!process.env.DATABASE_URL,
          error: "Connection returned null",
        },
      };
    }

    // Try to execute a simple query
    try {
      await db.execute({ sql: "SELECT 1", params: [], types: {} } as any);
      
      const status = getDatabaseStatus();
      return {
        service: "database",
        status: "healthy",
        message: "Database is connected and responding",
        details: {
          connected: true,
          attempts: status.attempts,
          lastError: status.lastError,
        },
      };
    } catch (queryError) {
      return {
        service: "database",
        status: "unhealthy",
        message: "Database connected but queries failing",
        details: {
          error: queryError instanceof Error ? queryError.message : "Unknown error",
        },
      };
    }
  } catch (error) {
    return {
      service: "database",
      status: "unhealthy",
      message: "Database connection failed",
      details: {
        configured: !!process.env.DATABASE_URL,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

async function checkR2Storage(): Promise<HealthCheckResult> {
  try {
    const r2Service = getR2Service();
    
    if (!r2Service) {
      const missing = [];
      if (!process.env.R2_ENDPOINT) missing.push("R2_ENDPOINT");
      if (!process.env.R2_ACCESS_KEY) missing.push("R2_ACCESS_KEY");
      if (!process.env.R2_SECRET) missing.push("R2_SECRET");
      if (!process.env.R2_BUCKET_NAME) missing.push("R2_BUCKET_NAME");
      
      return {
        service: "r2-storage",
        status: "unhealthy",
        message: "R2 storage not configured",
        details: {
          configured: false,
          missingVars: missing,
        },
      };
    }

    // Try to perform a simple operation (check if test object exists)
    try {
      await r2Service.getConfig("health-check-test-" + Date.now());
      // If we get here, R2 is accessible (even if object doesn't exist)
    } catch (error: any) {
      // 404 is expected (object doesn't exist), other errors are problems
      if (!error?.message?.includes("404") && !error?.message?.includes("not found")) {
        return {
          service: "r2-storage",
          status: "degraded",
          message: "R2 configured but connectivity issues",
          details: {
            configured: true,
            error: error?.message || "Connection test failed",
          },
        };
      }
    }

    return {
      service: "r2-storage",
      status: "healthy",
      message: "R2 storage is configured and accessible",
      details: {
        configured: true,
        bucket: process.env.R2_BUCKET_NAME,
        endpoint: process.env.R2_ENDPOINT?.replace(/https?:\/\//, ""),
      },
    };
  } catch (error) {
    return {
      service: "r2-storage",
      status: "unhealthy",
      message: "R2 storage check failed",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}

function checkShopifyConfig(): HealthCheckResult {
  const required = ["SHOPIFY_API_KEY", "SHOPIFY_API_SECRET", "SHOPIFY_DOMAIN"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    return {
      service: "shopify",
      status: "unhealthy",
      message: "Shopify not fully configured",
      details: {
        configured: false,
        missingVars: missing,
      },
    };
  }

  return {
    service: "shopify",
    status: "healthy",
    message: "Shopify configuration present",
    details: {
      configured: true,
      domain: process.env.SHOPIFY_DOMAIN,
      hasWebhookSecret: !!process.env.SHOPIFY_WEBHOOK_SECRET,
      hasStorefrontToken: !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
  };
}

function checkAuthConfig(): HealthCheckResult {
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasInternalToken = !!process.env.INTERNAL_API_TOKEN;

  if (!hasNextAuthSecret) {
    return {
      service: "authentication",
      status: "unhealthy",
      message: "Authentication not configured",
      details: {
        nextAuthSecret: false,
        internalApiToken: hasInternalToken,
      },
    };
  }

  return {
    service: "authentication",
    status: hasInternalToken ? "healthy" : "degraded",
    message: hasInternalToken 
      ? "Authentication fully configured" 
      : "Authentication configured but internal API token missing",
    details: {
      nextAuthSecret: true,
      internalApiToken: hasInternalToken,
    },
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Run all health checks in parallel
  const [dbHealth, r2Health, shopifyHealth, authHealth] = await Promise.all([
    checkDatabase(),
    checkR2Storage(),
    Promise.resolve(checkShopifyConfig()),
    Promise.resolve(checkAuthConfig()),
  ]);

  const services = [dbHealth, r2Health, shopifyHealth, authHealth];
  
  // Determine overall status
  const hasUnhealthy = services.some((s) => s.status === "unhealthy");
  const hasDegraded = services.some((s) => s.status === "degraded");
  
  let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";
  if (hasUnhealthy) {
    overallStatus = "unhealthy";
  } else if (hasDegraded) {
    overallStatus = "degraded";
  }

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      isProduction: process.env.NODE_ENV === "production",
    },
  };

  const duration = Date.now() - startTime;

  // Add response headers
  const headers = new Headers();
  headers.set("X-Response-Time", `${duration}ms`);
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");

  // Return appropriate status code
  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(response, {
    status: statusCode,
    headers,
  });
}