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
    theme: {
      colors: {
        primary: '#000000',
        background: '#ffffff',
        text: '#333333'
      },
      fonts: {
        primary: 'Inter, sans-serif'
      }
    },
    layout: {
      style: 'modern',
      spacing: 'comfortable'
    },
    branding: {
      title: 'Demo Site',
      description: 'Demo configuration when database is unavailable',
      logo: null
    },
    seo: {
      title: 'Demo Site',
      description: 'Demo configuration'
    }
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};