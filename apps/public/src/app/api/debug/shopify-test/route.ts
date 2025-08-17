import { NextResponse } from "next/server";
import { createEnhancedSiteConfig } from "@minimall/core/server";

export async function GET() {
  try {
    const shopDomain = process.env.SHOPIFY_DOMAIN || "cloudmamba.myshopify.com";
    const publicToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    const privateToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    const accessToken = publicToken || privateToken;

    console.log("Testing Shopify integration:", {
      shopDomain,
      hasPublicToken: !!publicToken,
      hasPrivateToken: !!privateToken,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0,
    });

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: "No access token configured",
        shopDomain,
        hasPublicToken: !!publicToken,
        hasPrivateToken: !!privateToken,
        envKeys: Object.keys(process.env).filter(k => k.includes('SHOPIFY')).map(k => k.replace(/TOKEN.*/, 'TOKEN_[REDACTED]')),
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
      hasToken: !!accessToken,
      tokenFirstChars: accessToken ? accessToken.substring(0, 4) + "..." : null,
      hasRealData,
      productCount: shopProducts.length,
      sampleProduct: sampleProduct ? {
        id: sampleProduct.id,
        title: sampleProduct.title,
        imageUrl: sampleProduct.card[1]?.image,
        imageContainsShopify: sampleProduct.card[1]?.image?.includes("cdn.shopify.com"),
      } : null,
      testImageUrls: shopProducts.slice(0, 3).map(p => p.card[1]?.image).filter(Boolean),
      debugInfo: {
        configId: config.id,
        categoriesCount: config.categories.length,
        shopifyConfigured: !!config.settings.shopify,
      }
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