import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { r2Service, createDefaultSiteConfig, createEnhancedSiteConfig, edgeCache, type SiteConfig } from '@minimall/core/server';
import { Renderer } from '@/components/renderer';
import { PreviewWrapper } from '@/components/preview-wrapper';

// Create enhanced demo config with real Shopify data when possible
let STABLE_DEMO_CONFIG: any = null;

async function getStableDemoConfig() {
  if (STABLE_DEMO_CONFIG) {
    return STABLE_DEMO_CONFIG;
  }

  const shopDomain = 'demo-shop.myshopify.com';
  const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || 
                     process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  try {
    // Try to create enhanced config with real data
    if (accessToken) {
      console.log('Creating enhanced demo config with real Shopify data');
      STABLE_DEMO_CONFIG = await createEnhancedSiteConfig(shopDomain, accessToken);
    } else {
      console.log('Creating demo config with mock data (no Shopify access token)');
      STABLE_DEMO_CONFIG = createDefaultSiteConfig(shopDomain);
    }
  } catch (error) {
    console.warn('Failed to create enhanced config, falling back to mock data:', error);
    STABLE_DEMO_CONFIG = createDefaultSiteConfig(shopDomain);
  }

  // Ensure stable properties
  STABLE_DEMO_CONFIG = {
    ...STABLE_DEMO_CONFIG,
    id: 'demo',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  return STABLE_DEMO_CONFIG;
}

// Edge-cached config loading with proper fallback strategy
async function loadConfigWithCache(configId: string, draftVersion?: string): Promise<SiteConfig> {
  const cacheKey = `config:${configId}${draftVersion ? `:${draftVersion}` : ''}`;
  
  // Try edge cache first (300s TTL as per spec)
  const cached = edgeCache.get<SiteConfig>(cacheKey);
  if (cached) {
    console.log(`Cache HIT for ${cacheKey}`);
    return cached;
  }

  console.log(`Cache MISS for ${cacheKey}, fetching from R2`);

  try {
    // Try R2 first - this is the production path
    const config = await r2Service.getConfig(configId, draftVersion);
    
    // Cache successful R2 fetch for 300s (5 minutes as per spec)
    edgeCache.set(cacheKey, config, 300);
    console.log(`R2 SUCCESS: Cached config ${cacheKey} for 300s`);
    
    return config;
  } catch (error) {
    console.warn(`R2 FAILED for ${cacheKey}:`, error instanceof Error ? error.message : 'Unknown error');
    
    // Fallback strategy based on environment and configId
    if (configId === 'demo') {
      // Demo always gets demo config
      return await getStableDemoConfig();
    }
    
    if (process.env.NODE_ENV === 'development') {
      // Development: return demo config with notice
      console.log(`DEV MODE: Serving demo config for ${configId}`);
      const demoConfig = await getStableDemoConfig();
      return { ...demoConfig, id: configId };
    }
    
    // Production: throw error for non-demo configs that aren't found
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

// Use Edge runtime for optimal performance
export const runtime = 'edge';

// Enable static generation with ISR - 300s matches the spec
export const revalidate = 300; // 5 minutes

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { configId } = await params;
  const { draft } = await searchParams;
  
  try {
    const config = await loadConfigWithCache(configId, draft);
    
    return {
      title: config.settings.seo?.title || `${config.settings.shopDomain} - Link in Bio`,
      description: config.settings.seo?.description || 'Ultra-fast link-in-bio storefront',
      keywords: config.settings.seo?.keywords,
      robots: 'index, follow',
      openGraph: {
        title: config.settings.seo?.title || `${config.settings.shopDomain} - Link in Bio`,
        description: config.settings.seo?.description || 'Ultra-fast link-in-bio storefront',
        type: 'website',
      },
    };
  } catch (error) {
    console.warn(`Failed to load config for metadata: ${configId}`, error);
    return {
      title: `Link in Bio - ${configId}`,
      description: 'Ultra-fast link-in-bio storefront',
      robots: 'index, follow',
    };
  }
}

export default async function SitePage({ params, searchParams }: PageProps) {
  const { configId } = await params;
  const { draft, preview } = await searchParams;

  // Debug logging
  console.log('[SitePage] Route accessed:', { configId, draft, timestamp: new Date().toISOString() });

  if (!configId) {
    console.log('[SitePage] No configId provided, showing 404');
    notFound();
  }

  try {
    // Use unified config loading with edge caching
    const config = await loadConfigWithCache(configId, draft);
    console.log(`Successfully loaded config for: ${configId}${draft ? ` (draft: ${draft})` : ''}`);

    // Handle preview mode
    if (preview === 'true') {
      return <PreviewWrapper initialConfig={config} isPreview={true} />;
    }

    // Special handling for demo config to use enhanced DemoRenderer
    if (configId === 'demo') {
      const { DemoRenderer } = await import('@/components/demo-renderer');
      
      const hasRealData = config.categories.some((cat: any) => 
        cat.categoryType[1]?.children?.some((item: any) => 
          item.card[1]?.image?.includes('cdn.shopify.com')
        )
      );
      
      return (
        <div className="min-h-screen bg-background">
          <div className={`border px-4 py-3 mb-4 ${hasRealData ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
            <strong>{hasRealData ? 'Live Data Mode:' : 'Demo Mode:'}</strong> 
            {hasRealData ? 
              ' This configuration is powered by real Shopify product data' : 
              ' This is a sample configuration showcasing platform features'
            }
          </div>
          <DemoRenderer config={config} />
        </div>
      );
    }

    // Production configs get appropriate status notices
    const isDev = process.env.NODE_ENV === 'development';
    const isServedFromCache = !!edgeCache.get(`config:${configId}${draft ? `:${draft}` : ''}`);
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
          <div className={`border px-4 py-3 mb-4 ${wasFromR2 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
            <strong>Dev Mode:</strong> 
            {wasFromR2 ? 
              ` Config loaded from R2${isServedFromCache ? ' (cached)' : ''}` :
              ` Config not found in R2, serving demo fallback`
            }
          </div>
        )}
        
        <Renderer config={config} />
      </div>
    );
    
  } catch (error) {
    console.error(`Failed to load config for ${configId}:`, error);
    
    // Production: show 404 for configs that cannot be loaded
    notFound();
  }
}