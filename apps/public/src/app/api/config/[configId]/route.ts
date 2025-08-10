import { NextRequest, NextResponse } from 'next/server';
import { r2Service, createDefaultSiteConfig, createEnhancedSiteConfig, edgeCache, type SiteConfig } from '@minimall/core/server';

// Use Node.js runtime for server-side operations
export const runtime = 'nodejs';

// Cache configuration
export const revalidate = 300; // 5 minutes

// Create enhanced demo config with real Shopify data when possible
let STABLE_DEMO_CONFIG: SiteConfig | null = null;

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
  try {
    const { configId } = await params;
    const { searchParams } = new URL(request.url);
    const draft = searchParams.get('draft') || undefined;
    
    console.log('[Config API] Loading config:', { configId, draft, timestamp: new Date().toISOString() });

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    const config = await loadConfigWithCache(configId, draft);
    console.log(`[Config API] Successfully loaded config for: ${configId}${draft ? ` (draft: ${draft})` : ''}`);

    // Add cache headers
    const headers = new Headers();
    headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    
    return NextResponse.json(config, {
      headers,
      status: 200
    });

  } catch (error) {
    console.error('[Config API] Failed to load config:', error);
    
    return NextResponse.json(
      { 
        error: 'Configuration not found',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
  }
}