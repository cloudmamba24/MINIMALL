import { getShopifyAuth } from "@minimall/core";
import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for crypto operations
export const runtime = 'nodejs';

// GET /api/auth/shopify/install - Start Shopify OAuth flow
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
    }

    const shopifyAuth = getShopifyAuth();

    // Validate shop domain format
    if (!shopifyAuth.validateShop(shop)) {
      return NextResponse.json({ error: "Invalid shop domain" }, { status: 400 });
    }

    // Generate state for CSRF protection
    const state = shopifyAuth.generateState();

    // Store state in cookie for verification
    const response = NextResponse.redirect(shopifyAuth.generateAuthUrl(shop, state));
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
    });

    // Store shop in cookie for callback verification
    response.cookies.set("oauth_shop", shop, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
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
