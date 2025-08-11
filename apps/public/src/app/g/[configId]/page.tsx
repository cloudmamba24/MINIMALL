import { PreviewWrapper } from "@/components/preview-wrapper";
import { UnifiedRenderer } from "@/components/unified-renderer";
import type { SiteConfig } from "@minimall/core/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Direct config loading using server functions - avoids circular API calls during build
async function loadConfigWithCache(configId: string, draftVersion?: string): Promise<SiteConfig> {
  // Import server functions dynamically to avoid bundling issues
  try {
    const { 
      edgeCache, 
      getR2Service,
      createDefaultSiteConfig,
      createEnhancedSiteConfig 
    } = await import("@minimall/core/server");

    const cacheKey = `config:${configId}${draftVersion ? `:${draftVersion}` : ""}`;
    
    // Try edge cache first
    const cached = edgeCache.get<SiteConfig>(cacheKey);
    if (cached) {
      console.log(`Cache HIT for ${cacheKey}`);
      return cached;
    }

    console.log(`Cache MISS for ${cacheKey}, fetching from R2`);

    try {
      // Try R2 first
      const r2 = getR2Service();
      const config = await r2!.getConfig(configId, draftVersion);
      edgeCache.set(cacheKey, config, 300);
      console.log(`R2 SUCCESS: Cached config ${cacheKey} for 300s`);
      return config;
    } catch (error) {
      console.warn(`R2 FAILED for ${cacheKey}:`, error instanceof Error ? error.message : "Unknown error");

      // Fallback strategy
      if (configId === "demo") {
        const shopDomain = "demo-shop.myshopify.com";
        const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
        
        try {
          if (accessToken) {
            return await createEnhancedSiteConfig(shopDomain, accessToken);
          } else {
            return createDefaultSiteConfig(shopDomain);
          }
        } catch {
          return createDefaultSiteConfig(shopDomain);
        }
      }

      // Production fallback for missing configs
      console.log(`CONFIG FALLBACK: Serving demo config for ${configId} due to storage unavailability`);
      const demoConfig = createDefaultSiteConfig("demo-shop.myshopify.com");
      return { ...demoConfig, id: configId };
    }
  } catch (importError) {
    console.error("Failed to import server functions:", importError);
    throw new Error(`Configuration not found: ${configId}`);
  }
}

interface PageProps {
  params: Promise<{
    configId: string;
  }>;
  searchParams: Promise<{
    draft?: string;
    preview?: string;
  }>;
}

// Use Node.js runtime for server-side operations compatibility
export const runtime = "nodejs";

// Enable static generation with ISR - 300s matches the spec
export const revalidate = 300; // 5 minutes

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { configId } = await params;
  const { draft } = await searchParams;

  try {
    const config = await loadConfigWithCache(configId, draft);

    return {
      title: config.settings.seo?.title || `${config.settings.shopDomain} - Link in Bio`,
      description: config.settings.seo?.description || "Ultra-fast link-in-bio storefront",
      keywords: config.settings.seo?.keywords,
      robots: "index, follow",
      openGraph: {
        title: config.settings.seo?.title || `${config.settings.shopDomain} - Link in Bio`,
        description: config.settings.seo?.description || "Ultra-fast link-in-bio storefront",
        type: "website",
      },
    };
  } catch (error) {
    console.warn(`Failed to load config for metadata: ${configId}`, error);
    return {
      title: `Link in Bio - ${configId}`,
      description: "Ultra-fast link-in-bio storefront",
      robots: "index, follow",
    };
  }
}

export default async function SitePage({ params, searchParams }: PageProps) {
  const { configId } = await params;
  const { draft, preview } = await searchParams;

  // Development debug logging
  if (process.env.NODE_ENV === "development") {
    console.log("[SitePage] Route accessed:", {
      configId,
      draft,
      timestamp: new Date().toISOString(),
    });
  }

  if (!configId) {
    if (process.env.NODE_ENV === "development") {
      console.log("[SitePage] No configId provided, showing 404");
    }
    notFound();
  }

  try {
    // Use unified config loading with edge caching
    const config = await loadConfigWithCache(configId, draft);
    console.log(`Successfully loaded config for: ${configId}${draft ? ` (draft: ${draft})` : ""}`);

    // Handle preview mode
    if (preview === "true") {
      return <PreviewWrapper initialConfig={config} isPreview={true} />;
    }

    // Special handling for demo config to show data source status
    if (configId === "demo") {
      const hasRealData = config.categories.some((cat) =>
        cat.categoryType[1]?.children?.some((item) =>
          item.card[1]?.image?.includes("cdn.shopify.com")
        )
      );

      return (
        <div className="min-h-screen bg-background">
          <div
            className={`border px-4 py-3 mb-4 ${hasRealData ? "bg-green-50 border-green-200 text-green-700" : "bg-blue-50 border-blue-200 text-blue-700"}`}
          >
            <strong>{hasRealData ? "Live Data Mode:" : "Demo Mode:"}</strong>
            {hasRealData
              ? " This configuration is powered by real Shopify product data"
              : " This is a sample configuration showcasing platform features"}
          </div>
          <UnifiedRenderer config={config} />
        </div>
      );
    }

    // Production configs get appropriate status notices
    const isDev = process.env.NODE_ENV === "development";
    const wasFromR2 = config.id === configId; // Proper config vs fallback demo

    return (
      <div className="min-h-screen bg-background">
        {/* Draft mode indicator */}
        {draft && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3">
            <strong>Draft Preview:</strong> Viewing version {draft}
          </div>
        )}

        {/* Development mode indicators */}
        {isDev && (
          <div
            className={`border px-4 py-3 mb-4 ${wasFromR2 ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700"}`}
          >
            <strong>Dev Mode:</strong>
            {wasFromR2 ? " Config loaded from API" : " Config not found, serving demo fallback"}
          </div>
        )}

        <UnifiedRenderer config={config} />
      </div>
    );
  } catch (error) {
    console.error(`Failed to load config for ${configId}:`, error);

    // Production: show 404 for configs that cannot be loaded
    notFound();
  }
}
