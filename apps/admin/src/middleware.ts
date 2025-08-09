import { NextRequest, NextResponse } from 'next/server';
import { getShopifyAuth } from '@minimall/core/auth/shopify-auth';

// Define public routes that don't require authentication
const publicRoutes = [
  '/api/auth/shopify/install',
  '/api/auth/shopify/callback',
  '/api/auth/session',
  '/api/webhooks',
  '/_next',
  '/favicon.ico',
  '/admin/auth/error',
];

// Define routes that require authentication
const protectedApiRoutes = [
  '/api/configs',
  '/api/assets',
  '/api/analytics',
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') && !pathname.startsWith('/admin/auth');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  try {
    const sessionToken = request.cookies.get('shopify_session')?.value;
    let session = null;

    if (sessionToken) {
      const shopifyAuth = getShopifyAuth();
      session = shopifyAuth.verifySessionToken(sessionToken);
    }

    // Handle protected API routes
    if (isProtectedApiRoute(pathname)) {
      if (!session) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Add shop context to headers for API routes
      const response = NextResponse.next();
      response.headers.set('x-shopify-shop-domain', session.shop);
      response.headers.set('x-shopify-access-token', session.accessToken);
      return response;
    }

    // Handle admin UI routes
    if (isAdminRoute(pathname)) {
      if (!session) {
        // Extract shop from query params for initial auth
        const shop = request.nextUrl.searchParams.get('shop');
        
        if (shop) {
          // Redirect to OAuth flow
          const installUrl = new URL('/api/auth/shopify/install', request.url);
          installUrl.searchParams.set('shop', shop);
          return NextResponse.redirect(installUrl);
        }

        // No shop parameter, show error
        const errorUrl = new URL('/admin/auth/error', request.url);
        errorUrl.searchParams.set('error', 'no_shop_provided');
        return NextResponse.redirect(errorUrl);
      }

      // User is authenticated, add shop info to headers
      const response = NextResponse.next();
      response.headers.set('x-shopify-shop-domain', session.shop);
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // For API routes, return JSON error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }

    // For admin routes, redirect to error page
    const errorUrl = new URL('/admin/auth/error', request.url);
    errorUrl.searchParams.set('error', 'authentication_error');
    return NextResponse.redirect(errorUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};