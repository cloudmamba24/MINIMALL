import { NextRequest, NextResponse } from 'next/server';
import { createShopifyClient } from '../../../lib/shopify-client';

// GET /api/shopify/cart/[cartId] - Get cart
export async function GET(
  request: NextRequest,
  { params }: { params: { cartId: string } }
) {
  try {
    const { cartId } = params;
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
      // Mock cart response
      return NextResponse.json({
        cart: {
          id: cartId,
          lines: { edges: [] },
          cost: {
            totalAmount: { amount: '0.00', currencyCode: 'USD' },
            subtotalAmount: { amount: '0.00', currencyCode: 'USD' },
          },
          checkoutUrl: `https://checkout.example.com/${cartId}`,
        },
        source: 'mock',
        warning: 'Using mock cart - configure Shopify credentials'
      });
    }

    const cart = await client.getCart(cartId);
    
    return NextResponse.json({
      cart,
      source: 'shopify'
    });

  } catch (error) {
    console.error('Cart fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

// POST /api/shopify/cart/[cartId] - Add to cart
export async function POST(
  request: NextRequest,
  { params }: { params: { cartId: string } }
) {
  try {
    const { cartId } = params;
    const { shopDomain, lines } = await request.json();

    if (!shopDomain || !lines) {
      return NextResponse.json(
        { error: 'Shop domain and lines are required' },
        { status: 400 }
      );
    }

    const client = createShopifyClient(shopDomain);
    
    if (!client) {
      // Mock add to cart response
      return NextResponse.json({
        cart: {
          id: cartId,
          lines: {
            edges: lines.map((line: any, index: number) => ({
              node: {
                id: `mock_line_${Date.now()}_${index}`,
                quantity: line.quantity,
                merchandise: {
                  id: line.merchandiseId,
                  title: 'Mock Product',
                  image: {
                    url: 'https://via.placeholder.com/300x300',
                    altText: 'Mock Product',
                  },
                  product: {
                    title: 'Mock Product',
                    handle: 'mock-product',
                  },
                  price: {
                    amount: '25.00',
                    currencyCode: 'USD',
                  },
                },
              },
            })),
          },
          cost: {
            totalAmount: {
              amount: (lines.reduce((sum: number, line: any) => sum + line.quantity, 0) * 25).toString(),
              currencyCode: 'USD',
            },
            subtotalAmount: {
              amount: (lines.reduce((sum: number, line: any) => sum + line.quantity, 0) * 25).toString(),
              currencyCode: 'USD',
            },
          },
          checkoutUrl: `https://checkout.example.com/${cartId}`,
        },
        source: 'mock',
        warning: 'Using mock cart - configure Shopify credentials'
      });
    }

    const cart = await client.addToCart(cartId, lines);
    
    return NextResponse.json({
      cart,
      source: 'shopify'
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}