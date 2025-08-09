import { getShopifyAuth } from "@minimall/core";
import { type NextRequest, NextResponse } from "next/server";

// Force Node.js runtime for crypto operations
export const runtime = 'nodejs';

// GET /api/auth/session - Get current session info
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("shopify_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const shopifyAuth = getShopifyAuth();
    const session = shopifyAuth.verifySessionToken(sessionToken);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      shop: session.shop,
      scope: session.scope,
      expiresAt: session.expiresAt?.toISOString(),
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

// DELETE /api/auth/session - Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("shopify_session");
  return response;
}
