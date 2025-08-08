import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { r2Service, createDefaultSiteConfig } from '@minimall/core';
import { Renderer } from '@/components/renderer';

// Create stable demo config to prevent infinite re-renders
const STABLE_DEMO_CONFIG = (() => {
  const config = createDefaultSiteConfig('demo-shop.myshopify.com');
  return {
    ...config,
    id: 'demo',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
})();

interface PageProps {
  params: Promise<{
    configId: string;
  }>;
  searchParams: Promise<{
    draft?: string;
  }>;
}

// Use Node.js runtime for better compatibility with complex state management
export const runtime = 'nodejs';

// Enable static generation with ISR
export const revalidate = 300; // 5 minutes

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { configId } = await params;
  
  // Handle demo config directly without R2
  if (configId === 'demo') {
    return {
      title: STABLE_DEMO_CONFIG.settings.seo?.title || `${STABLE_DEMO_CONFIG.settings.shopDomain} - Link in Bio`,
      description: STABLE_DEMO_CONFIG.settings.seo?.description || 'Ultra-fast link-in-bio storefront',
      keywords: STABLE_DEMO_CONFIG.settings.seo?.keywords,
      robots: 'index, follow',
      openGraph: {
        title: STABLE_DEMO_CONFIG.settings.seo?.title || `${STABLE_DEMO_CONFIG.settings.shopDomain} - Link in Bio`,
        description: STABLE_DEMO_CONFIG.settings.seo?.description || 'Ultra-fast link-in-bio storefront',
        type: 'website',
      },
    };
  }
  
  try {
    const config = await r2Service.getConfig(configId);
    
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
    return {
      title: `Link in Bio - ${configId}`,
      description: 'Ultra-fast link-in-bio storefront',
      robots: 'index, follow',
    };
  }
}

export default async function SitePage({ params, searchParams }: PageProps) {
  const { configId } = await params;
  const { draft } = await searchParams;

  // Debug logging
  console.log('[SitePage] Route accessed:', { configId, draft, timestamp: new Date().toISOString() });

  if (!configId) {
    console.log('[SitePage] No configId provided, showing 404');
    notFound();
  }

  // Handle demo config directly without R2 - use interactive DemoRenderer
  if (configId === 'demo') {
    // Import DemoRenderer dynamically to avoid SSR issues
    const { DemoRenderer } = await import('@/components/demo-renderer');
    
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 mb-4">
          <strong>Demo Mode:</strong> This is a sample configuration showcasing platform features
        </div>
        <DemoRenderer config={STABLE_DEMO_CONFIG} />
      </div>
    );
  }

  // For non-demo configs, try R2 first
  try {
    console.log(`Attempting to fetch config for: ${configId}${draft ? ` (version: ${draft})` : ''}`);
    const config = await r2Service.getConfig(configId, draft);
    console.log(`Successfully fetched config for: ${configId}`);
    
    return <Renderer config={config} />;
  } catch (error) {
    console.error(`Failed to fetch config for ${configId}:`, error);
    
    // In development, show demo config with error notice
    if (process.env.NODE_ENV === 'development') {
      const fallbackConfig = { ...STABLE_DEMO_CONFIG, id: configId };
      
      return (
        <div className="min-h-screen bg-background">
          {draft && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3">
              <strong>Draft Mode:</strong> Viewing version {draft}
            </div>
          )}
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4">
            <strong>Development Mode:</strong> Config "{configId}" not found in R2. Showing demo configuration instead.
            <br />
            <small>Error: {error instanceof Error ? error.message : 'Unknown error'}</small>
          </div>
          <Renderer config={fallbackConfig} />
        </div>
      );
    }
    
    // Production: show 404 for non-demo configs that aren't found
    notFound();
  }
}