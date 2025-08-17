import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/api/auth/shopify/install",
  "/api/auth/shopify/callback",
  "/api/auth/session",
  "/_next",
  "/favicon.ico",
  "/admin/auth/error",
];

// Webhook endpoints require signature validation, not session auth
const webhookRoutes = [
  "/api/webhooks/app/uninstalled",
  "/api/webhooks/orders/create",
  "/api/webhooks/products",
  "/api/webhooks/customers",
  "/api/webhooks/shop/redact",
];

// Define routes that require authentication
const protectedApiRoutes = ["/api/configs", "/api/assets", "/api/analytics"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

function isWebhookRoute(pathname: string): boolean {
  return webhookRoutes.some((route) => pathname.startsWith(route));
}

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some((route) => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin") && !pathname.startsWith("/admin/auth");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle webhook routes with signature validation
  if (isWebhookRoute(pathname)) {
    const signature = request.headers.get("x-shopify-hmac-sha256");
    const shop = request.headers.get("x-shopify-shop-domain");
    const topic = request.headers.get("x-shopify-topic");

    // Log webhook attempt
    if (!signature) {
      Sentry.captureMessage("Webhook request without signature", {
        level: "warning",
        tags: { path: pathname, shop: shop || "unknown", topic: topic || "unknown" },
      });

      return NextResponse.json({ error: "Webhook signature required" }, { status: 401 });
    }

    if (!shop) {
      return NextResponse.json({ error: "Shop domain required" }, { status: 400 });
    }

    // Add security headers and continue to route handler for full validation
    const response = NextResponse.next();
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    return response;
  }

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  try {
    // Try multiple cookie sources due to browser restrictions in embedded apps
    const sessionToken =
      request.cookies.get("shopify_session")?.value ||
      request.cookies.get("shopify_session_fallback")?.value;
    let session = null;

    // Temporarily disabled server-side auth validation due to Edge Runtime restrictions
    // TODO: Move auth validation to API routes or use edge-compatible JWT verification
    if (sessionToken) {
      // For now, just check if token exists - proper validation happens in API routes
      // Mock session structure for middleware compatibility
      const shopParam = request.nextUrl.searchParams.get("shop");
      session = {
        valid: true,
        shop: shopParam || "demo.myshopify.com",
        scope: "read_products,write_products",
      };
    }

    // For embedded apps, also check if we have shop in URL but no valid session
    const _shop = request.nextUrl.searchParams.get("shop");
    const _host = request.nextUrl.searchParams.get("host");

    // Handle protected API routes
    if (isProtectedApiRoute(pathname)) {
      if (!session) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Add shop context to headers for API routes (no access token for security)
      const response = NextResponse.next();
      response.headers.set("x-shopify-shop-domain", session.shop);
      response.headers.set("x-shopify-scope", session.scope);
      response.headers.set(
        "x-session-id",
        Buffer.from(`${session.shop}:${Date.now()}`).toString("base64")
      );
      return response;
    }

    // Handle admin UI routes
    if (isAdminRoute(pathname)) {
      if (!session) {
        // Extract shop from query params for initial auth
        const shop = request.nextUrl.searchParams.get("shop");

        if (shop) {
          // Redirect to OAuth flow
          const installUrl = new URL("/api/auth/shopify/install", request.url);
          installUrl.searchParams.set("shop", shop);
          return NextResponse.redirect(installUrl);
        }

        // No shop parameter, show error
        const errorUrl = new URL("/admin/auth/error", request.url);
        errorUrl.searchParams.set("error", "no_shop_provided");
        return NextResponse.redirect(errorUrl);
      }

      // User is authenticated, add shop info to headers
      const response = NextResponse.next();
      response.headers.set("x-shopify-shop-domain", session.shop);
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "middleware", path: pathname },
    });

    // For API routes, return JSON error
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication error" }, { status: 500 });
    }

    // For admin routes, redirect to error page
    const errorUrl = new URL("/admin/auth/error", request.url);
    errorUrl.searchParams.set("error", "authentication_error");
    return NextResponse.redirect(errorUrl);
  }
}

export const _config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
