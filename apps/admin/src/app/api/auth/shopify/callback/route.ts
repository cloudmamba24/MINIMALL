import { getShopifyAuth } from "@minimall/core";
import { createDatabase } from "@minimall/db";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/auth/shopify/callback - Handle OAuth callback from Shopify
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const shop = url.searchParams.get("shop");
    const hmac = url.searchParams.get("hmac");

    // Verify required parameters
    if (!code || !state || !shop || !hmac) {
      return NextResponse.json({ error: "Missing required OAuth parameters" }, { status: 400 });
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

    // Store session in database (create or update user)
    const db = createDatabase(process.env.DATABASE_URL!);
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
        permissions: JSON.stringify([]),
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          shopDomain: shop,
          updatedAt: new Date(),
        },
      });

    // Create session token
    const sessionToken = shopifyAuth.createSessionToken(session);

    // Create response with redirect to admin app
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin`);

    // Set session cookie
    response.cookies.set("shopify_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // Required for embedded apps
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
