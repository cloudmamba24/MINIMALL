import { http, HttpResponse } from 'msw';
import { mockProducts, mockOrders, mockShop } from '../fixtures';

/**
 * MSW request handlers for API mocking
 */
export const handlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'healthy' });
  }),

  // Shopify API mocks
  http.get('https://*.myshopify.com/admin/api/*/products.json', () => {
    return HttpResponse.json({ products: mockProducts });
  }),

  http.get('https://*.myshopify.com/admin/api/*/orders.json', () => {
    return HttpResponse.json({ orders: mockOrders });
  }),

  http.get('https://*.myshopify.com/admin/api/*/shop.json', () => {
    return HttpResponse.json({ shop: mockShop });
  }),

  // Config API mocks
  http.get('/api/configs', () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  http.post('/api/configs', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      data: {
        id: 'test-config-id',
        ...body,
      },
    });
  }),

  // Asset upload mock
  http.post('/api/assets/upload', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 'test-asset-id',
        url: 'https://example.com/test-asset.jpg',
      },
    });
  }),

  // Webhook mock
  http.post('/api/webhooks/*', () => {
    return HttpResponse.json({ success: true });
  }),
];