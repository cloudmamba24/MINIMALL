import { describe, it, expect } from 'vitest';
import { 
  createMockSiteConfig, 
  createMockShopifyProduct,
  createMockR2Service,
  createMockShopifyService 
} from './test-utils';

describe('test-utils', () => {
  describe('createMockSiteConfig', () => {
    it('should create a valid mock site config', () => {
      const config = createMockSiteConfig();
      
      expect(config).toHaveProperty('id', 'test-config');
      expect(config).toHaveProperty('version', '1.0.0');
      expect(config).toHaveProperty('categories');
      expect(config).toHaveProperty('settings');
      expect(config.categories).toHaveLength(1);
      expect(config.settings.shopDomain).toBe('test.myshopify.com');
    });

    it('should allow overriding properties', () => {
      const config = createMockSiteConfig({
        id: 'custom-config',
        settings: {
          ...createMockSiteConfig().settings,
          shopDomain: 'custom.myshopify.com'
        }
      });

      expect(config.id).toBe('custom-config');
      expect(config.settings.shopDomain).toBe('custom.myshopify.com');
    });
  });

  describe('createMockShopifyProduct', () => {
    it('should create a valid mock Shopify product', () => {
      const product = createMockShopifyProduct();

      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('title', 'Test Product');
      expect(product).toHaveProperty('images');
      expect(product).toHaveProperty('variants');
      expect(product.images).toHaveLength(1);
      expect(product.variants).toHaveLength(1);
    });

    it('should allow overriding properties', () => {
      const product = createMockShopifyProduct({
        title: 'Custom Product',
        handle: 'custom-product'
      });

      expect(product.title).toBe('Custom Product');
      expect(product.handle).toBe('custom-product');
    });
  });

  describe('createMockR2Service', () => {
    it('should create a mock R2 service with all methods', () => {
      const mockService = createMockR2Service();

      expect(mockService).toHaveProperty('getConfig');
      expect(mockService).toHaveProperty('putConfig');
      expect(mockService).toHaveProperty('deleteConfig');
      expect(mockService).toHaveProperty('listConfigs');
      
      // Verify they are vi.fn() mocks
      expect(vi.isMockFunction(mockService.getConfig)).toBe(true);
      expect(vi.isMockFunction(mockService.putConfig)).toBe(true);
    });
  });

  describe('createMockShopifyService', () => {
    it('should create a mock Shopify service with all methods', async () => {
      const mockService = createMockShopifyService();

      expect(mockService).toHaveProperty('getProduct');
      expect(mockService).toHaveProperty('getProducts');
      expect(mockService).toHaveProperty('createCart');
      expect(mockService).toHaveProperty('addToCart');
      
      // Verify they return expected mock data
      await expect(mockService.getProduct()).resolves.toHaveProperty('title', 'Test Product');
      await expect(mockService.createCart()).resolves.toHaveProperty('id', 'test-cart-id');
    });
  });
});