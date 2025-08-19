import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return NextResponse.json(
        { error: "missing_shop", message: "Shop parameter required" },
        { status: 400 }
      );
    }

    // In a real implementation, you would fetch this from Shopify API
    // using the shop's access token stored during OAuth
    // For now, we'll return mock data based on the shop domain
    
    // This would typically be fetched from:
    // 1. Your database where you stored shop info during OAuth
    // 2. Or directly from Shopify Admin API using the shop's access token
    
    const mockShopData = {
      shopDomain: shop,
      owner: {
        name: "John Doe", // Would come from Shopify shop.shop_owner
        email: `admin@${shop}`, // Would come from Shopify shop.email
      },
      shop: {
        name: shop.replace(".myshopify.com", "").replace(/-/g, " "),
        currency: "USD",
        timezone: "America/New_York"
      }
    };

    return NextResponse.json(mockShopData);
  } catch (error) {
    console.error("Shop info error:", error);
    return NextResponse.json(
      { error: "fetch_failed", message: "Failed to fetch shop information" },
      { status: 500 }
    );
  }
}