import {
  type SiteConfig,
  createDefaultSiteConfig,
  createEnhancedSiteConfig,
  edgeCache,
  getR2Service,
} from "@minimall/core/server";
import { type NextRequest, NextResponse } from "next/server";

// Use Node.js runtime for server-side operations
export const runtime = "nodejs";

// Cache configuration
export const revalidate = 300; // 5 minutes

// Create enhanced demo config with real Shopify data when possible
let STABLE_DEMO_CONFIG: SiteConfig | null = null;

async function getStableDemoConfig() {
  if (STABLE_DEMO_CONFIG) {
    return STABLE_DEMO_CONFIG;
  }

  const shopDomain = "demo-shop.myshopify.com";
  const accessToken =
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  try {
    // Try to create enhanced config with real data
    if (accessToken) {
      STABLE_DEMO_CONFIG = await createEnhancedSiteConfig(shopDomain, accessToken);
    } else {
      STABLE_DEMO_CONFIG = createDefaultSiteConfig(shopDomain);
    }
  } catch (error) {
    // Fallback to mock data on error
    STABLE_DEMO_CONFIG = createDefaultSiteConfig(shopDomain);
  }

  // Ensure stable properties
  STABLE_DEMO_CONFIG = {
    ...STABLE_DEMO_CONFIG,
    id: "demo",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  return STABLE_DEMO_CONFIG;
}

// Edge-cached config loading with proper fallback strategy
async function loadConfigWithCache(configId: string, draftVersion?: string): Promise<SiteConfig> {
  const cacheKey = `config:${configId}${draftVersion ? `:${draftVersion}` : ""}`;

  // Try edge cache first (300s TTL as per spec)
  const cached = edgeCache.get<SiteConfig>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Try R2 first - this is the production path
    const r2Service = getR2Service();
    if (r2Service) {
      const config = await r2Service.getConfig(configId, draftVersion);

      // Cache successful R2 fetch for 300s (5 minutes as per spec) with tags
      const tags = [
        `config:${configId}`,
        `config:${configId}:${draftVersion ? "draft" : "published"}`,
      ];
      edgeCache.set(cacheKey, config, 300, tags);

      return config;
    } else {
      throw new Error("R2 service not available");
    }
  } catch (error) {
    // R2 fetch failed, try fallback strategies

    // Fallback strategy based on environment and configId
    if (configId === "demo") {
      // Demo always gets demo config
      return await getStableDemoConfig();
    }

    // In development, provide fallback for easier debugging
    if (process.env.NODE_ENV === "development" && process.env.ENABLE_DEV_FALLBACKS === "true") {
      console.warn(`Using demo config as fallback for configId: ${configId}`);
      const demoConfig = await getStableDemoConfig();
      return { ...demoConfig, id: configId };
    }

    // Production and strict development: throw error for configs that aren't found
    console.error(`Configuration not found: ${configId}. R2 error: ${error}`);
    throw new Error(`Configuration not found: ${configId}`);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;
    const { searchParams } = new URL(request.url);
    const draft = searchParams.get("draft") || undefined;

    if (!configId) {
      return NextResponse.json({ error: "Configuration ID is required" }, { status: 400 });
    }

    const config = await loadConfigWithCache(configId, draft);

    // Add cache headers
    const headers = new Headers();
    headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");

    return NextResponse.json(config, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("[Config API] Failed to load config:", error);

    return NextResponse.json(
      {
        error: "Configuration not found",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 404 }
    );
  }
}
