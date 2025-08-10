import { NextRequest, NextResponse } from "next/server";
import { getStorefrontToken } from "@minimall/core/server";

/**
 * Get storefront access token for a specific shop
 * This API endpoint allows client-side code to get per-shop tokens
 * without importing server-side database code
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shopDomain: string }> }
) {
  try {
    const { shopDomain } = await context.params;
    
    if (!shopDomain) {
      return NextResponse.json(
        { error: "Shop domain is required" },
        { status: 400 }
      );
    }

    // Decode the shop domain from URL
    const decodedShopDomain = decodeURIComponent(shopDomain);
    
    // Get token from database or fallback chain
    const token = await getStorefrontToken(decodedShopDomain);
    
    if (!token) {
      return NextResponse.json(
        { error: "No token found for shop" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      token,
      shopDomain: decodedShopDomain,
    });
    
  } catch (error) {
    console.error("Error fetching shop token:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop token" },
      { status: 500 }
    );
  }
}