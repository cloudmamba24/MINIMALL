import { NextRequest, NextResponse } from 'next/server';
import { createShopifyClient } from '../../../lib/shopify-client';

// POST /api/shopify/cart - Create new cart
export async function POST(request: NextRequest) {
  try {
    const { shopDomain, lines = [] } = await request.json();
    
    if (!shopDomain) {
      return NextResponse.json(
        { error: 'Shop domain is required' },
        { status: 400 }
      );
    }

    const client = createShopifyClient(shopDomain);
    
    if (!client) {
      // Mock cart creation for development
      const mockCartId = `mock_cart_${Date.now()}`;
      return NextResponse.json({
        cart: {
          id: mockCartId,
          lines: {
            edges: lines.map((line: any, index: number) => ({
              node: {
                id: `mock_line_${index}`,
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
              amount: (lines.length * 25).toString(),
              currencyCode: 'USD',
            },
            subtotalAmount: {
              amount: (lines.length * 25).toString(),
              currencyCode: 'USD',
            },
          },
          checkoutUrl: `https://checkout.example.com/${mockCartId}`,
        },
        source: 'mock',
        warning: 'Using mock cart - configure Shopify credentials'
      });
    }

    const cart = await client.createCart(lines);
    
    return NextResponse.json({
      cart,
      source: 'shopify'
    });

  } catch (error) {
    console.error('Cart creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create cart' },
      { status: 500 }
    );
  }
}

// GET /api/shopify/cart/[cartId] would be handled by [cartId]/route.ts