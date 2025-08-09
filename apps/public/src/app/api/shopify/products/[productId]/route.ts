import { NextRequest, NextResponse } from 'next/server';
import { createShopifyClient } from '../../../lib/shopify-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const shopDomain = searchParams.get('shop') || process.env.SHOPIFY_DOMAIN;

    if (!shopDomain) {
      return NextResponse.json(
        { error: 'Shop domain is required' },
        { status: 400 }
      );
    }

    const client = createShopifyClient(shopDomain);
    
    if (!client) {
      // Return mock product if no Shopify credentials
      const { getMockProduct } = await import('../../../lib/shopify-client');
      const mockProduct = getMockProduct(productId);
      
      if (mockProduct) {
        return NextResponse.json({
          product: mockProduct,
          source: 'mock',
          warning: 'Using mock data - configure SHOPIFY_STOREFRONT_ACCESS_TOKEN'
        });
      }
      
      return NextResponse.json(
        { error: 'Product not found and Shopify not configured' },
        { status: 404 }
      );
    }

    const product = await client.getProduct(productId);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      product,
      source: 'shopify'
    });

  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}