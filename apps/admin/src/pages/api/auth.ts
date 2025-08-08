import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

interface AuthRequest {
  shop?: string;
  host?: string;
  hmac?: string;
  code?: string;
  state?: string;
  timestamp?: string;
}

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL ? 
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback` : 
  'http://localhost:3001/api/auth/callback';

// Required Shopify scopes
const SCOPES = [
  'read_products',
  'write_products',
  'read_product_listings',
  'write_script_tags',
  'write_themes',
  'read_themes'
].join(',');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { shop, host, hmac, code, state, timestamp } = req.query as AuthRequest;

  // Missing required environment variables
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
    console.error('Missing Shopify API credentials');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Shopify API credentials are not configured'
    });
  }

  // If no shop parameter, show error
  if (!shop) {
    return res.status(400).json({ 
      error: 'Missing shop parameter',
      message: 'This endpoint must be accessed from a Shopify admin panel'
    });
  }

  // Validate shop domain format
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
  if (!shopDomain.match(/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/)) {
    return res.status(400).json({ 
      error: 'Invalid shop domain',
      message: 'Shop domain must be a valid .myshopify.com domain'
    });
  }

  // If we have a code, this is a callback from Shopify OAuth
  if (code) {
    return handleAuthCallback(req, res, { 
      shop: shopDomain, 
      code,
      ...(state && { state }),
      ...(hmac && { hmac }),
      ...(host && { host }),
    });
  }

  // Otherwise, redirect to Shopify OAuth
  return initiateOAuth(req, res, shopDomain, host);
}

function initiateOAuth(req: NextApiRequest, res: NextApiResponse, shop: string, host?: string) {
  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store state in session/cookie for validation (simplified for demo)
  res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; SameSite=Lax; Max-Age=600`);

  const authUrl = `https://${shop}/admin/oauth/authorize?` + new URLSearchParams({
    client_id: SHOPIFY_API_KEY!,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
    grant_options: '',
  });

  // In embedded app context, we need to break out of iframe
  if (host) {
    // Return redirect instruction for App Bridge
    return res.json({
      type: 'redirect',
      url: authUrl,
      host
    });
  }

  // Direct redirect for non-embedded access
  res.redirect(authUrl);
}

async function handleAuthCallback(
  req: NextApiRequest, 
  res: NextApiResponse, 
  { shop, code, state, hmac, host }: { shop: string; code: string; state?: string; hmac?: string; host?: string }
) {
  try {
    // Validate state (CSRF protection)
    const cookies = parseCookies(req.headers.cookie || '');
    if (!state || !cookies.oauth_state || cookies.oauth_state !== state) {
      console.error('OAuth state mismatch');
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Validate HMAC if present
    if (hmac) {
      const queryString = Object.keys(req.query)
        .filter(key => key !== 'hmac')
        .map(key => `${key}=${req.query[key]}`)
        .sort()
        .join('&');
      
      const expectedHmac = crypto
        .createHmac('sha256', SHOPIFY_API_SECRET!)
        .update(queryString)
        .digest('hex');
      
      if (hmac !== expectedHmac) {
        console.error('Invalid HMAC signature');
        return res.status(400).json({ error: 'Invalid request signature' });
      }
    }

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    if (!access_token) {
      throw new Error('No access token received');
    }

    // Store access token securely (in production, use encrypted database storage)
    // For now, we'll use a simple session approach
    res.setHeader('Set-Cookie', [
      `shopify_shop=${shop}; HttpOnly; SameSite=Lax; Max-Age=86400`,
      `shopify_token=${access_token}; HttpOnly; SameSite=Lax; Max-Age=86400`,
      'oauth_state=; HttpOnly; SameSite=Lax; Max-Age=0' // Clear state cookie
    ]);

    // Redirect back to admin app
    const adminUrl = host ? 
      `/admin?host=${encodeURIComponent(host)}&shop=${encodeURIComponent(shop)}` :
      `/admin?shop=${encodeURIComponent(shop)}`;

    res.redirect(adminUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
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