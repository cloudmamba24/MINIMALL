import { authRateLimiter, generateDoubleSubmitToken, getShopifyAuth } from "@minimall/core/server";
import { createDatabase } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for crypto operations
export const runtime = "nodejs";

// GET /api/auth/shopify/callback - Handle OAuth callback from Shopify
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const shop = url.searchParams.get("shop");
    const hmac = url.searchParams.get("hmac");
    const clientIP =
      request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    // Rate limiting for callback attempts
    if (!authRateLimiter.isAllowed(clientIP)) {
      const _timeUntilReset = Math.ceil(authRateLimiter.getTimeUntilReset(clientIP) / 1000);
      const errorUrl = new URL("/admin/auth/error", process.env.NEXT_PUBLIC_APP_URL);
      errorUrl.searchParams.set("error", "rate_limit_exceeded");
      return NextResponse.redirect(errorUrl.toString());
    }

    // Verify required parameters
    if (!code || !state || !shop || !hmac) {
      console.error("Missing OAuth parameters:", {
        code: !!code,
        state: !!state,
        shop: !!shop,
        hmac: !!hmac,
        allParams: Object.fromEntries(url.searchParams.entries()),
      });

      const errorUrl = new URL("/admin/auth/error", process.env.NEXT_PUBLIC_APP_URL);
      errorUrl.searchParams.set("error", !shop ? "no_shop_provided" : "authentication_failed");
      return NextResponse.redirect(errorUrl.toString());
    }

    const shopifyAuth = getShopifyAuth();

    // Validate shop domain
    if (!shopifyAuth.validateShop(shop)) {
      return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 });
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get("oauth_state")?.value;
    const storedShop = request.cookies.get("oauth_shop")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
    }

    if (!storedShop || storedShop !== shop) {
      return NextResponse.json({ error: "Shop mismatch" }, { status: 400 });
    }

    // Verify HMAC signature
    if (!shopifyAuth.validateHmac(url.searchParams, hmac)) {
      return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 });
    }

    // Exchange code for access token
    const session = await shopifyAuth.exchangeCodeForToken(shop, code);

    // Store session in database (create or update user) - skip if no DATABASE_URL
    if (process.env.DATABASE_URL) {
      try {
        const db = createDatabase(process.env.DATABASE_URL);
        const { users } = await import("@minimall/db");

        await db
          .insert(users)
          .values({
            email: session.onlineAccessInfo?.associated_user?.email || `admin@${shop}`,
            name: session.onlineAccessInfo
              ? `${session.onlineAccessInfo.associated_user.first_name} ${session.onlineAccessInfo.associated_user.last_name}`.trim()
              : "Admin",
            shopDomain: shop,
            role: session.onlineAccessInfo?.associated_user?.account_owner ? "owner" : "editor",
            permissions: [],
          })
          .onConflictDoUpdate({
            target: users.email,
            set: {
              shopDomain: shop,
              updatedAt: new Date(),
            },
          });
      } catch (dbError) {
        console.error("Database error (continuing without storage):", dbError);
      }
    } else {
      console.warn("DATABASE_URL not configured - skipping user storage");
    }

    // Create session token
    const sessionToken = shopifyAuth.createSessionToken(session);

    // Create response with redirect to Admin home (root). Avoid 404 if /admin route doesn't exist.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${url.protocol}//${url.host}`;
    const redirectUrl = new URL(baseUrl);
    redirectUrl.pathname = "/";
    // Preserve context for embedded/hosted scenarios
    redirectUrl.searchParams.set("shop", shop);
    redirectUrl.searchParams.set("host", Buffer.from(`${shop}/admin`).toString("base64"));

    const response = NextResponse.redirect(redirectUrl.toString());

    // Set session cookie with enhanced security
    response.cookies.set("shopify_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 7, // Reduced to 7 days for better security
      path: "/",
      // Add additional security flags
      ...(process.env.NODE_ENV === "production" && {
        domain: new URL(process.env.NEXT_PUBLIC_APP_URL || "").hostname,
      }),
    });

    // Set fallback cookie for browsers that don't support sameSite=none
    response.cookies.set("shopify_session_fallback", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // Reduced to 7 days
      path: "/",
      ...(process.env.NODE_ENV === "production" && {
        domain: new URL(process.env.NEXT_PUBLIC_APP_URL || "").hostname,
      }),
    });

    // Set session fingerprint for additional security
    const sessionFingerprint = generateDoubleSubmitToken(sessionToken);
    response.cookies.set("session_fingerprint", sessionFingerprint.hash, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Clear OAuth cookies
    response.cookies.delete("oauth_state");
    response.cookies.delete("oauth_shop");

    Sentry.addBreadcrumb({
      category: "shopify-auth",
      message: `OAuth successful for shop: ${shop}`,
      level: "info",
    });

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    Sentry.captureException(error);

    // Redirect to error page instead of JSON response for better UX
    const errorUrl = new URL("/admin/auth/error", process.env.NEXT_PUBLIC_APP_URL);
    errorUrl.searchParams.set("error", "authentication_failed");

    return NextResponse.redirect(errorUrl.toString());
  }
}
