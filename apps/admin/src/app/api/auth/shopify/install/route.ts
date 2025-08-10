import { getShopifyAuth } from "@minimall/core/server";
import { installRateLimiter } from "@minimall/core/server";
import { createTokenHash, generateDoubleSubmitToken, generateToken } from "@minimall/core/server";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for crypto operations
export const runtime = "nodejs";

// GET /api/auth/shopify/install - Start Shopify OAuth flow
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");
    const clientIP =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    // Rate limiting by IP address
    if (!installRateLimiter.isAllowed(clientIP)) {
      const timeUntilReset = Math.ceil(installRateLimiter.getTimeUntilReset(clientIP) / 1000);
      return NextResponse.json(
        {
          error: "Too many requests",
          retryAfter: timeUntilReset,
        },
        {
          status: 429,
          headers: { "Retry-After": timeUntilReset.toString() },
        }
      );
    }

    const shopifyAuth = getShopifyAuth();

    // Validate shop domain format
    if (!shopifyAuth.validateShop(shop)) {
      return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 });
    }

    // Generate state for CSRF protection
    const state = shopifyAuth.generateState();

    // Generate additional CSRF token
    const _csrfToken = generateDoubleSubmitToken(
      process.env.SHOPIFY_API_SECRET || "fallback-secret"
    );
    const csrfData = generateToken();

    // Store state in cookie for verification
    const response = NextResponse.redirect(shopifyAuth.generateAuthUrl(shop, state));
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    // Store shop in cookie for callback verification
    response.cookies.set("oauth_shop", shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    // Store CSRF token data for additional protection
    const csrfHash = createTokenHash(csrfData, process.env.SHOPIFY_API_SECRET || "fallback-secret");
    response.cookies.set("csrf_hash", csrfHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    // Store timestamp for CSRF validation
    response.cookies.set("csrf_timestamp", csrfData.timestamp.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    Sentry.addBreadcrumb({
      category: "shopify-auth",
      message: `Starting OAuth flow for shop: ${shop}`,
      level: "info",
    });

    return response;
  } catch (error) {
    console.error("OAuth install error:", error);
    Sentry.captureException(error);

    return NextResponse.json({ error: "Failed to start OAuth flow" }, { status: 500 });
  }
}
