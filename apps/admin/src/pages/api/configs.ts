import type { NextApiRequest, NextApiResponse } from 'next';

interface Config {
  id: string;
  shop: string;
  slug: string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGetConfigs(req, res);
    case 'POST':
      return handleCreateConfig(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function handleGetConfigs(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { shop } = req.query;

    if (!shop || typeof shop !== 'string') {
      return res.status(400).json({ 
        error: 'Missing shop parameter',
        message: 'Shop domain is required'
      });
    }

    // Get authentication
    const cookies = parseCookies(req.headers.cookie || '');
    const authShop = cookies.shopify_shop;
    const accessToken = cookies.shopify_token;

    if (!authShop || !accessToken) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please authenticate with Shopify first'
      });
    }

    if (authShop !== shop) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'You can only access configs for your own shop'
      });
    }

    // In a real implementation, this would query the database
    // For now, return mock data to demonstrate the UI
    const mockConfigs: Config[] = [
      {
        id: 'demo',
        shop: shop,
        slug: 'my-link-in-bio',
        currentVersionId: 'v1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    // TODO: Replace with actual database query
    // const db = await getDatabase();
    // const configs = await db.configs.findMany({
    //   where: { shop },
    //   orderBy: { updatedAt: 'desc' }
    // });

    res.json({ 
      success: true,
      configs: mockConfigs,
      count: mockConfigs.length
    });

  } catch (error) {
    console.error('Get configs error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch configurations',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleCreateConfig(req: NextApiRequest, res: NextApiResponse) {
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

    const { slug, name } = req.body;

    if (!slug) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Slug is required'
      });
    }

    // TODO: Validate slug format and uniqueness
    // TODO: Create config in database
    // TODO: Create default site configuration

    const newConfig: Config = {
      id: `config_${Date.now()}`,
      shop,
      slug,
      currentVersionId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      config: newConfig
    });

  } catch (error) {
    console.error('Create config error:', error);
    res.status(500).json({ 
      error: 'Failed to create configuration',
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