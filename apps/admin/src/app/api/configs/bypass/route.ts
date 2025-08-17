import { createDefaultSiteConfig, getR2Service } from "@minimall/core/server";
import { type NextRequest, NextResponse } from "next/server";

// POST /api/configs/bypass - create config without database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shopDomain = body.shopDomain || "cloudmamba.myshopify.com";
    
    // Create default config
    const config = createDefaultSiteConfig(shopDomain);
    
    // Try to save to R2 if available
    const r2 = getR2Service();
    if (r2) {
      try {
        // Use the correct method name
        await r2.saveConfig(config.id, config);
        console.log(`Config ${config.id} saved to R2`);
      } catch (error) {
        console.warn("Could not save to R2:", error);
      }
    }
    
    return NextResponse.json({
      success: true,
      configId: config.id,
      message: "Config created (bypassing database)",
      viewUrl: `https://minimall-tau.vercel.app/g/${config.id}`,
      editUrl: `/editor/${config.id}`,
      note: "This config is stored in R2, not the database"
    });
    
  } catch (error) {
    console.error("Bypass config creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create config", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}