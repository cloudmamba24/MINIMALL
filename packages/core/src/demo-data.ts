import type { SiteConfig } from './types';

export const demoSiteConfig: SiteConfig = {
  id: 'demo-config',
  version: '1.0.0',
  categories: [
    {
      id: 'demo-category',
      title: 'Demo Category',
      card: ['image', {
        image: 'https://via.placeholder.com/300x200',
        description: 'Demo content when database is unavailable'
      }],
      categoryType: ['content', { children: [], displayType: 'grid' }],
      order: 1,
      visible: true
    }
  ],
  settings: {
    checkoutLink: '',
    shopDomain: 'demo.myshopify.com',
    theme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      accentColor: '#0066cc',
      fontFamily: 'Inter, sans-serif',
      borderRadius: 'md'
    },
    seo: {
      title: 'Demo Site',
      description: 'Demo configuration when database is unavailable'
    },
    brand: {
      name: 'Demo Site',
      subtitle: 'Demo configuration when database is unavailable'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};