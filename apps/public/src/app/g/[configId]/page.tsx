import { PreviewWrapper } from "@/components/preview-wrapper";
import { UnifiedRenderer } from "@/components/unified-renderer";
import type { SiteConfig } from "@minimall/core/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Client-safe config loading using API route
async function loadConfigWithCache(configId: string, draftVersion?: string): Promise<SiteConfig> {
  const searchParams = new URLSearchParams();
  if (draftVersion) {
    searchParams.set("draft", draftVersion);
  }

  const apiUrl = `/api/config/${configId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  try {
    const response = await fetch(
      new URL(
        apiUrl,
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "https://minimall-public.vercel.app"
      ).toString(),
      {
        next: { revalidate: 300 }, // 5 minutes cache
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
    }

    const config = await response.json();
    console.log(
      `Successfully loaded config via API for: ${configId}${draftVersion ? ` (draft: ${draftVersion})` : ""}`
    );

    return config;
  } catch (error) {
    console.error(`Failed to load config via API for ${configId}:`, error);
    throw error;
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

// Use Edge runtime for optimal performance
export const runtime = "edge";

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
