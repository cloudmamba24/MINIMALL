import type { NextApiRequest, NextApiResponse } from 'next';

interface ShopInfo {
  id: string;
  name: string;
  domain: string;
  email: string;
  plan_name: string;
  created_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get shop and token from cookies (set by auth flow)
    const cookies = parseCookies(req.headers.cookie || '');
    const shop = cookies.shopify_shop;
    const accessToken = cookies.shopify_token;

    if (!shop || !accessToken) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please authenticate with Shopify first'
      });
    }

    // Fetch shop information from Shopify Admin API
    const shopResponse = await fetch(`https://${shop}/admin/api/2023-04/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (!shopResponse.ok) {
      if (shopResponse.status === 401) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Shopify access token is invalid or expired'
        });
      }
      
      throw new Error(`Shop API request failed: ${shopResponse.status}`);
    }

    const shopData = await shopResponse.json();
    const shopInfo: ShopInfo = shopData.shop;

    // Return filtered shop information
    res.json({
      id: shopInfo.id,
      name: shopInfo.name,
      domain: shopInfo.domain,
      email: shopInfo.email,
      plan_name: shopInfo.plan_name,
      created_at: shopInfo.created_at,
    });

  } catch (error) {
    console.error('Shop info API error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shop information',
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