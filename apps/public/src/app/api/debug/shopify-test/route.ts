import { NextResponse } from "next/server";
import { createEnhancedSiteConfig } from "@minimall/core/server";

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

    // Use the same function as the demo page
    const config = await createEnhancedSiteConfig(shopDomain, accessToken);

    // Check if the config has real data
    const hasRealData = config.categories.some((cat) =>
      cat.categoryType[1]?.children?.some((item) =>
        item.card[1]?.image?.includes("cdn.shopify.com")
      )
    );

    // Get a sample image URL from the shop products
    const shopProducts = config.categories.find(cat => cat.id === "shop")?.categoryType[1]?.children || [];
    const sampleProduct = shopProducts[0];

    console.log(`Config created with ${shopProducts.length} products, hasRealData: ${hasRealData}`);

    return NextResponse.json({
      success: true,
      shopDomain,
      hasRealData,
      productCount: shopProducts.length,
      sampleProduct: sampleProduct ? {
        id: sampleProduct.id,
        title: sampleProduct.title,
        imageUrl: sampleProduct.card[1]?.image,
        imageContainsShopify: sampleProduct.card[1]?.image?.includes("cdn.shopify.com"),
      } : null,
      testImageUrls: shopProducts.slice(0, 3).map(p => p.card[1]?.image).filter(Boolean),
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