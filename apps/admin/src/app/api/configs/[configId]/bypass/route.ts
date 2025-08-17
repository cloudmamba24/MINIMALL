import { createEnhancedSiteConfig, getR2Service } from "@minimall/core/server";
import { type NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{
    configId: string;
  }>;
}

// GET /api/configs/[configId]/bypass - get config bypassing database
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { configId } = await params;
    
    // Try to load from R2 first
    const r2 = getR2Service();
    if (r2) {
      try {
        const config = await r2.getConfig(configId);
        if (config) {
          return NextResponse.json({ success: true, config });
        }
      } catch (error) {
        console.log("Config not in R2:", error);
      }
    }
    
    // If not in R2, create an enhanced config with real Shopify products
    const shopDomain = process.env.SHOPIFY_DOMAIN || "cloudmamba.myshopify.com";
    const accessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    const config = await createEnhancedSiteConfig(shopDomain, accessToken);
    config.id = configId; // Use the requested ID
    
    return NextResponse.json({ 
      success: true, 
      config,
      note: "Default config returned (not from storage)"
    });
    
  } catch (error) {
    console.error("Bypass config load failed:", error);
    return NextResponse.json(
      { error: "Failed to load config", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}