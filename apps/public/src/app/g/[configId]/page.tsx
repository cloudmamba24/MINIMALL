import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { r2Service, createDefaultSiteConfig } from '@minimall/core';
import { Renderer } from '@/components/renderer';

interface PageProps {
  params: Promise<{
    configId: string;
  }>;
  searchParams: Promise<{
    draft?: string;
  }>;
}

// Edge runtime for global performance
export const runtime = 'edge';

// Enable static generation with ISR
export const revalidate = 300; // 5 minutes

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { configId } = await params;
  
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

  if (!configId) {
    notFound();
  }

  try {
    // Fetch config from R2
    const config = await r2Service.getConfig(configId, draft);
    
    return <Renderer config={config} />;
  } catch (error) {
    console.error('Failed to fetch config:', error);
    
    // For development, show a demo config
    if (process.env.NODE_ENV === 'development') {
      const demoConfig = createDefaultSiteConfig('demo-shop.myshopify.com');
      demoConfig.id = configId;
      
      return (
        <div className="min-h-screen bg-background">
          {draft && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3">
              <strong>Draft Mode:</strong> Viewing version {draft}
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 mb-4">
            <strong>Development Mode:</strong> Showing demo configuration since R2 config not found
          </div>
          <Renderer config={demoConfig} />
        </div>
      );
    }
    
    // Production: show 404
    notFound();
  }
}