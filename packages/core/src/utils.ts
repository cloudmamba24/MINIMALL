import type { 
  SiteConfig, 
  Category, 
  CartItem, 
  ShopifyProduct, 
  ShopifyVariant,
  PerformanceMetrics 
} from './types';

// Configuration utilities
export function validateSiteConfig(config: unknown): config is SiteConfig {
  try {
    // Basic validation - in a real implementation, use Zod schema
    return (
      typeof config === 'object' &&
      config !== null &&
      'id' in config &&
      'categories' in config &&
      'settings' in config
    );
  } catch {
    return false;
  }
}

export function generateConfigId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createDefaultSiteConfig(shopDomain: string): SiteConfig {
  return {
    id: generateConfigId(),
    version: '1.0.0',
    categories: [
      {
        id: 'instagram',
        title: 'Instagram',
        card: ['grid', {
          link: null,
          shape: ['square'],
        }],
        categoryType: ['feed', {
          children: [],
          displayType: 'grid',
          itemsPerRow: 3,
        }],
        order: 1,
        visible: true,
      },
      {
        id: 'shop',
        title: 'Shop',
        card: ['product', {
          link: null,
        }],
        categoryType: ['products', {
          children: [],
          products: [],
          displayType: 'grid',
          itemsPerRow: 2,
        }],
        order: 2,
        visible: true,
      },
      {
        id: 'lookbook',
        title: 'Lookbook',
        card: ['image', {
          link: null,
          shape: ['landscape'],
        }],
        categoryType: ['gallery', {
          children: [],
          displayType: 'slider',
        }],
        order: 3,
        visible: true,
      },
    ],
    settings: {
      checkoutLink: `https://${shopDomain}/cart`,
      shopDomain,
      theme: {
        primaryColor: '#000000',
        backgroundColor: '#FFFFFF',
        textColor: '#333333',
        accentColor: '#6366F1',
        fontFamily: 'Inter',
        borderRadius: 'md',
      },
      seo: {
        title: 'My Link in Bio',
        description: 'Shop my curated collection',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Category utilities
export function findCategoryById(categories: Category[], id: string): Category | null {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }
    if (category.children) {
      const found = findCategoryById(category.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function flattenCategories(categories: Category[]): Category[] {
  const result: Category[] = [];
  
  function traverse(cats: Category[]) {
    for (const cat of cats) {
      result.push(cat);
      if (cat.children) {
        traverse(cat.children);
      }
    }
  }
  
  traverse(categories);
  return result;
}

export function reorderCategories(categories: Category[], fromIndex: number, toIndex: number): Category[] {
  const result = [...categories];
  const [removed] = result.splice(fromIndex, 1);
  if (!removed) {
    return result;
  }
  result.splice(toIndex, 0, removed);
  
  // Update order properties
  return result.map((cat, index) => ({
    ...cat,
    order: index + 1,
  }));
}

// Cart utilities
export function calculateCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

export function formatPrice(amount: number, currencyCode = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount / 100); // Assuming amounts are in cents
}

export function generateCartId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function addToCart(
  currentItems: CartItem[],
  product: ShopifyProduct,
  variantId: string,
  quantity = 1
): CartItem[] {
  const variant = product.variants.find(v => v.id === variantId);
  if (!variant) {
    throw new Error('Variant not found');
  }

  const existingItemIndex = currentItems.findIndex(
    item => item.productId === product.id && item.variantId === variantId
  );

  if (existingItemIndex >= 0) {
    // Update existing item quantity
    const updatedItems = [...currentItems];
    const existingItem = updatedItems[existingItemIndex];
    if (existingItem) {
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + quantity,
      };
    }
    return updatedItems;
  }

  // Add new item
  const newItem: CartItem = {
    id: `${product.id}_${variantId}`,
    productId: product.id,
    variantId,
    title: product.title,
    price: parseFloat(variant.price.amount) * 100, // Convert to cents
    quantity,
    image: variant.image?.url || product.images[0]?.url || '',
    variant: {
      title: variant.title,
      selectedOptions: variant.selectedOptions,
    },
  };

  return [...currentItems, newItem];
}

export function removeFromCart(currentItems: CartItem[], itemId: string): CartItem[] {
  return currentItems.filter(item => item.id !== itemId);
}

export function updateCartItemQuantity(
  currentItems: CartItem[],
  itemId: string,
  quantity: number
): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(currentItems, itemId);
  }

  return currentItems.map(item =>
    item.id === itemId ? { ...item, quantity } : item
  );
}

// Shopify utilities
export function buildCheckoutUrl(shopDomain: string, items: CartItem[]): string {
  const baseUrl = `https://${shopDomain}/cart`;
  
  if (items.length === 0) {
    return baseUrl;
  }

  // Build variant query string
  const variantParams = items.map(item => 
    `${item.variantId}:${item.quantity}`
  ).join(',');

  return `${baseUrl}/${variantParams}`;
}

export function extractShopFromDomain(domain: string): string {
  // Handle both myshopify.com and custom domains
  if (domain.includes('.myshopify.com')) {
    return domain.replace('.myshopify.com', '');
  }
  return domain.split('.')[0] || '';
}

export function buildStorefrontUrl(shopDomain: string): string {
  if (shopDomain.includes('.myshopify.com')) {
    return `https://${shopDomain}`;
  }
  return `https://${shopDomain}.myshopify.com`;
}

// Performance utilities
export function measureLCP(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(0);
      return;
    }

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      resolve(lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Fallback after 5 seconds
    setTimeout(() => resolve(0), 5000);
  });
}

export function measureFID(): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(0);
      return;
    }

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      resolve(lastEntry.processingStart - lastEntry.startTime);
    }).observe({ entryTypes: ['first-input'] });

    // Fallback after 5 seconds
    setTimeout(() => resolve(0), 5000);
  });
}

export function createPerformanceMetrics(configId: string): Partial<PerformanceMetrics> {
  if (typeof window === 'undefined') {
    return { configId, timestamp: new Date() };
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    configId,
    ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
    timestamp: new Date(),
    userAgent: navigator.userAgent,
    connection: (navigator as any).connection?.effectiveType,
  };
}

// URL utilities
export function buildSiteUrl(baseUrl: string, configId: string, draft?: string): string {
  const url = new URL(`/g/${configId}`, baseUrl);
  if (draft) {
    url.searchParams.set('draft', draft);
  }
  return url.toString();
}

export function buildProductUrl(baseUrl: string, configId: string, productId: string): string {
  return new URL(`/g/${configId}/qv/${productId}`, baseUrl).toString();
}

// Image utilities
export function optimizeImageUrl(url: string, width?: number, height?: number): string {
  if (!url.includes('cdn.shopify.com')) {
    return url;
  }

  const urlObj = new URL(url);
  
  if (width) {
    urlObj.searchParams.set('width', width.toString());
  }
  
  if (height) {
    urlObj.searchParams.set('height', height.toString());
  }

  // Add format optimization
  urlObj.searchParams.set('format', 'webp');
  
  return urlObj.toString();
}

export function generateImageSrcSet(url: string, sizes: number[]): string {
  return sizes
    .map(size => `${optimizeImageUrl(url, size)} ${size}w`)
    .join(', ');
}

// Validation utilities
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    return html; // Server-side: implement proper sanitization
  }
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Deep clone utility
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Local storage utilities
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function safeLocalStorageSet<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}