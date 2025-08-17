import { getR2Service } from "@minimall/core";
import { type NextRequest, NextResponse } from "next/server";

interface HealthCheckResult {
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  message: string;
  details?: any;
}

async function checkR2Storage(): Promise<HealthCheckResult> {
  try {
    const r2Service = getR2Service();
    
    if (!r2Service) {
      return {
        service: "r2-storage",
        status: "unhealthy",
        message: "R2 storage not configured",
        details: {
          configured: false,
          note: "Public site requires R2 for config loading",
        },
      };
    }

    // Try to load demo config as a test
    try {
      await r2Service.getConfig("demo");
    } catch (error: any) {
      // Any error except 404 is a problem
      if (!error?.message?.includes("404") && !error?.message?.includes("not found")) {
        return {
          service: "r2-storage",
          status: "degraded",
          message: "R2 connectivity issues",
          details: {
            error: error?.message || "Connection test failed",
          },
        };
      }
    }

    return {
      service: "r2-storage",
      status: "healthy",
      message: "R2 storage is accessible",
      details: {
        configured: true,
        bucket: process.env.R2_BUCKET_NAME,
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

function checkShopifyStorefront(): HealthCheckResult {
  const hasToken = !!process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || 
                   !!process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  const hasDomain = !!process.env.SHOPIFY_DOMAIN || 
                    !!process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;

  if (!hasToken || !hasDomain) {
    return {
      service: "shopify-storefront",
      status: "degraded",
      message: "Shopify Storefront API not fully configured",
      details: {
        hasToken,
        hasDomain,
        note: "Product data will use demo/mock data",
      },
    };
  }

  return {
    service: "shopify-storefront",
    status: "healthy",
    message: "Shopify Storefront API configured",
    details: {
      configured: true,
      domain: process.env.SHOPIFY_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN,
    },
  };
}

function checkEnvironment(): HealthCheckResult {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;

  return {
    service: "environment",
    status: "healthy",
    message: "Environment configuration",
    details: {
      nodeEnv: process.env.NODE_ENV || "development",
      baseUrl: baseUrl || "not set",
      adminUrl: adminUrl || "not set",
      isProduction: process.env.NODE_ENV === "production",
    },
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Run health checks
  const [r2Health, shopifyHealth, envHealth] = await Promise.all([
    checkR2Storage(),
    Promise.resolve(checkShopifyStorefront()),
    Promise.resolve(checkEnvironment()),
  ]);

  const services = [r2Health, shopifyHealth, envHealth];
  
  // Determine overall status
  const hasUnhealthy = services.some((s) => s.status === "unhealthy");
  const hasDegraded = services.some((s) => s.status === "degraded");
  
  let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";
  if (hasUnhealthy) {
    overallStatus = "unhealthy";
  } else if (hasDegraded) {
    overallStatus = "degraded";
  }

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    app: "public",
    responseTime: `${Date.now() - startTime}ms`,
    version: "1.0.0",
    routes: {
      homepage: "/",
      demo: "/g/demo",
      r2Debug: "/api/debug/r2",
      health: "/api/health",
    },
  };

  const headers = new Headers();
  headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
  headers.set("X-Response-Time", `${Date.now() - startTime}ms`);

  // Always return 200 for monitoring tools, use response body for status
  return NextResponse.json(response, {
    status: 200,
    headers,
  });
}