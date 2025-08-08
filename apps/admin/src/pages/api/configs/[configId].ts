import type { NextApiRequest, NextApiResponse } from 'next';
import type { SiteConfig } from '@minimall/core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { configId } = req.query;

  if (!configId || typeof configId !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid config ID',
      message: 'Config ID is required and must be a string'
    });
  }

  switch (method) {
    case 'GET':
      return handleGetConfig(req, res, configId);
    case 'PUT':
      return handleUpdateConfig(req, res, configId);
    case 'DELETE':
      return handleDeleteConfig(req, res, configId);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function handleGetConfig(req: NextApiRequest, res: NextApiResponse, configId: string) {
  try {
    // Get authentication
    const cookies = parseCookies(req.headers.cookie || '');
    const shop = cookies.shopify_shop;
    const accessToken = cookies.shopify_token;

    if (!shop || !accessToken) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please authenticate with Shopify first'
      });
    }

    // For demo purposes, return a mock config for 'demo' configId
    // In production, this would query the database
    if (configId === 'demo') {
      const mockConfig: SiteConfig = {
        id: 'demo',
        version: '1.0.0',
        categories: [
          {
            id: 'instagram',
            title: 'INSTAGRAM',
            card: ['grid', { link: null, shape: ['square'] }],
            categoryType: ['feed', {
              children: [
                {
                  id: 'instagram-1',
                  title: 'Latest Post',
                  card: ['image', {
                    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
                    clickAction: { type: 'modal', target: 'instagram-1' },
                    hoverEffect: { type: 'zoom', intensity: 0.05, duration: 200 },
                  }],
                  categoryType: ['single', { children: [] }],
                  order: 1,
                  visible: true,
                },
              ],
              displayType: 'grid',
              itemsPerRow: 2,
            }],
            order: 1,
            visible: true,
          },
          {
            id: 'shop',
            title: 'SHOP',
            card: ['product', { link: null }],
            categoryType: ['products', {
              children: [
                {
                  id: 'product-1',
                  title: 'Essential Tee',
                  card: ['product', {
                    link: 'https://demo-shop.myshopify.com/products/essential-tee',
                    price: '$29.00',
                    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
                  }],
                  categoryType: ['single', { children: [] }],
                  order: 1,
                  visible: true,
                },
              ],
              products: [],
              displayType: 'grid',
              itemsPerRow: 2,
            }],
            order: 2,
            visible: true,
          },
        ],
        settings: {
          checkoutLink: 'https://demo-shop.myshopify.com/cart',
          shopDomain: 'demo-shop.myshopify.com',
          brand: {
            name: 'DEMO.STORE',
            subtitle: 'Interactive link in bio tool by maker',
            socialLinks: {
              instagram: 'https://instagram.com/demo',
              twitter: 'https://twitter.com/demo',
              pinterest: 'https://pinterest.com/demo',
            },
            ctaButton: {
              text: 'Visit Demo.Store',
              url: 'https://demo-shop.myshopify.com',
            },
          },
          theme: {
            primaryColor: '#FFFFFF',
            backgroundColor: '#000000',
            textColor: '#FFFFFF',
            accentColor: '#666666',
            fontFamily: 'Inter',
            borderRadius: 'sm',
          },
          seo: {
            title: 'DEMO.STORE - Link in Bio',
            description: 'Interactive link in bio for fashion and lifestyle brands',
            keywords: 'fashion, lifestyle, shopping, demo',
          },
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        config: mockConfig,
      });
    }

    // TODO: Implement database query for real configs
    // const db = await getDatabase();
    // const config = await db.configs.findFirst({
    //   where: { id: configId, shop },
    //   include: { currentVersion: true }
    // });

    // if (!config) {
    //   return res.status(404).json({
    //     error: 'Configuration not found',
    //     message: `Config ${configId} not found`
    //   });
    // }

    return res.status(404).json({
      error: 'Configuration not found',
      message: `Config ${configId} not found`
    });

  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleUpdateConfig(req: NextApiRequest, res: NextApiResponse, configId: string) {
  try {
    // Get authentication
    const cookies = parseCookies(req.headers.cookie || '');
    const shop = cookies.shopify_shop;
    const accessToken = cookies.shopify_token;

    if (!shop || !accessToken) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please authenticate with Shopify first'
      });
    }

    const { config, isDraft = true } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Missing config data',
        message: 'Configuration data is required'
      });
    }

    // TODO: Validate config schema
    // const validationResult = validateSiteConfig(config);
    // if (!validationResult.valid) {
    //   return res.status(400).json({
    //     error: 'Invalid configuration',
    //     message: validationResult.errors.join(', ')
    //   });
    // }

    // TODO: Save to database and R2
    // const db = await getDatabase();
    // const r2Service = await getR2Service();

    // // Create new version
    // const version = await db.configVersions.create({
    //   data: {
    //     configId,
    //     data: config,
    //     isPublished: !isDraft,
    //     createdBy: shop, // or user ID
    //   }
    // });

    // // Update current version if publishing
    // if (!isDraft) {
    //   await db.configs.update({
    //     where: { id: configId },
    //     data: { currentVersionId: version.id }
    //   });
      
    //   // Save to R2 for public access
    //   await r2Service.saveConfig(configId, config);
    // }

    // For demo purposes, just return success
    res.json({
      success: true,
      message: isDraft ? 'Draft saved successfully' : 'Configuration published successfully',
      config: {
        ...config,
        updatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ 
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleDeleteConfig(req: NextApiRequest, res: NextApiResponse, configId: string) {
  try {
    // Get authentication
    const cookies = parseCookies(req.headers.cookie || '');
    const shop = cookies.shopify_shop;
    const accessToken = cookies.shopify_token;

    if (!shop || !accessToken) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please authenticate with Shopify first'
      });
    }

    // TODO: Implement config deletion
    // const db = await getDatabase();
    // const r2Service = await getR2Service();

    // // Delete from database
    // await db.configs.delete({
    //   where: { id: configId, shop }
    // });

    // // Delete from R2
    // await r2Service.deleteConfig(configId);

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });

  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({ 
      error: 'Failed to delete configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });
  
  return cookies;
}