import { NextResponse } from "next/server";

export async function GET() {
  try {
    const shopDomain = process.env.SHOPIFY_DOMAIN || "cloudmamba.myshopify.com";
    const accessToken =
      process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
      process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    console.log("Testing Shopify integration:", {
      shopDomain,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0,
    });

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: "No access token configured",
        shopDomain,
      });
    }

    // Import dynamically to match the page logic
    const { createShopifyStorefrontService } = await import("@minimall/core/services/shopify-storefront");
    const { transformProduct } = await import("@minimall/core/services/shopify-transformer");

    const shopifyService = createShopifyStorefrontService(shopDomain, accessToken);
    const searchResult = await shopifyService.searchProducts("*", 3);
    
    const products = (searchResult.products as unknown[]).map((p) =>
      transformProduct(p as any)
    );

    console.log(`Successfully loaded ${products.length} products`);

    return NextResponse.json({
      success: true,
      shopDomain,
      productCount: products.length,
      sampleProduct: products[0] ? {
        id: products[0].id,
        title: products[0].title,
        imageUrl: products[0].images[0]?.url,
        imageContainsShopify: products[0].images[0]?.url?.includes("cdn.shopify.com"),
      } : null,
    });

  } catch (error) {
    console.error("Shopify test failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}