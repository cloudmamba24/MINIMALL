import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { LivePreview } from './live-preview';
import { AppProvider } from '@shopify/polaris';
import type { SiteConfig } from '@minimall/core';

// Sample configuration for preview
const sampleConfig: SiteConfig = {
  id: 'preview-config',
  shop: 'preview-shop.myshopify.com',
  slug: 'preview-store',
  content: [
    {
      id: 'hero-image',
      type: 'image',
      title: 'Hero Banner',
      position: 1,
      isVisible: true,
      src: 'https://picsum.photos/800/400?random=1',
      alt: 'Beautiful storefront banner',
      width: 800,
      height: 400,
    },
    {
      id: 'welcome-text',
      type: 'text',
      title: 'Welcome Message',
      position: 2,
      isVisible: true,
      content: 'Welcome to our amazing store! Discover our latest collection.',
      style: {
        fontSize: 24,
        color: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'featured-product',
      type: 'product',
      title: 'Featured Item',
      position: 3,
      isVisible: true,
      productId: 'gid://shopify/Product/123456789',
      handle: 'featured-product',
      showPrice: true,
      showDescription: true,
    },
    {
      id: 'shop-button',
      type: 'link',
      title: 'Shop Now',
      position: 4,
      isVisible: true,
      href: 'https://shop.example.com',
      target: '_blank',
      style: {
        buttonStyle: 'primary',
      },
    },
  ],
  settings: {
    shopDomain: 'preview-shop.myshopify.com',
    theme: {
      primaryColor: '#2563eb',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
    },
    seo: {
      title: 'Preview Store - Link in Bio',
      description: 'Check out our amazing products and latest updates!',
    },
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const minimalConfig: SiteConfig = {
  id: 'minimal-config',
  shop: 'minimal-shop.myshopify.com',
  slug: 'minimal-store',
  content: [
    {
      id: 'simple-text',
      type: 'text',
      title: 'Simple Message',
      position: 1,
      isVisible: true,
      content: 'Coming Soon!',
      style: {
        fontSize: 32,
        color: '#374151',
        textAlign: 'center',
      },
    },
  ],
  settings: {
    shopDomain: 'minimal-shop.myshopify.com',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const meta: Meta<typeof LivePreview> = {
  title: 'Admin/Live Preview',
  component: LivePreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Real-time preview system that displays site configurations across multiple viewports with live updates via postMessage communication. Features responsive design testing and cross-origin iframe communication.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AppProvider i18n={{}}>
        <div style={{ padding: '1rem', height: '100vh', minHeight: '600px' }}>
          <Story />
        </div>
      </AppProvider>
    ),
  ],
  argTypes: {
    config: {
      description: 'Site configuration object to preview',
    },
    selectedViewport: {
      control: 'select',
      options: ['mobile', 'tablet', 'desktop'],
      description: 'Currently selected viewport size',
    },
    onViewportChange: {
      description: 'Callback when viewport selection changes',
      action: 'viewport-changed',
    },
    onRefresh: {
      description: 'Callback when preview refresh is requested',
      action: 'preview-refreshed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    config: sampleConfig,
    selectedViewport: 'desktop',
    onViewportChange: (viewport) => {
      console.log('Viewport changed:', viewport);
    },
    onRefresh: () => {
      console.log('Preview refreshed');
    },
  },
};

export const MobileView: Story = {
  args: {
    config: sampleConfig,
    selectedViewport: 'mobile',
    onViewportChange: (viewport) => {
      console.log('Viewport changed:', viewport);
    },
    onRefresh: () => {
      console.log('Preview refreshed');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Preview in mobile viewport showing responsive design and mobile-optimized layout.',
      },
    },
  },
};

export const TabletView: Story = {
  args: {
    config: sampleConfig,
    selectedViewport: 'tablet',
    onViewportChange: (viewport) => {
      console.log('Viewport changed:', viewport);
    },
    onRefresh: () => {
      console.log('Preview refreshed');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Preview in tablet viewport demonstrating intermediate screen size handling.',
      },
    },
  },
};

export const MinimalConfig: Story = {
  args: {
    config: minimalConfig,
    selectedViewport: 'desktop',
    onViewportChange: (viewport) => {
      console.log('Viewport changed:', viewport);
    },
    onRefresh: () => {
      console.log('Preview refreshed');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Preview with minimal configuration showing basic content rendering.',
      },
    },
  },
};

export const InteractiveViewports: Story = {
  render: () => {
    const [viewport, setViewport] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    const [refreshCount, setRefreshCount] = React.useState(0);

    return (
      <div>
        <div style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          background: '#f5f5f5', 
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <strong>Preview Controls:</strong>
            <div style={{ fontSize: '12px', marginTop: '0.25rem' }}>
              Current Viewport: {viewport} | Refreshed: {refreshCount} times
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['mobile', 'tablet', 'desktop'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setViewport(size)}
                style={{
                  padding: '0.5rem 1rem',
                  border: viewport === size ? '2px solid #2563eb' : '1px solid #ccc',
                  borderRadius: '4px',
                  background: viewport === size ? '#eff6ff' : '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textTransform: 'capitalize'
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <LivePreview
          config={sampleConfig}
          selectedViewport={viewport}
          onViewportChange={setViewport}
          onRefresh={() => {
            setRefreshCount(prev => prev + 1);
            console.log('Preview refreshed');
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive preview with viewport switching controls and refresh functionality.',
      },
    },
  },
};

export const PreviewFeatures: Story = {
  render: () => (
    <AppProvider i18n={{}}>
      <div style={{ padding: '1rem' }}>
        <h3>Live Preview Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2563eb' }}>📱 Multi-Viewport</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>Mobile (375px)</li>
              <li>Tablet (768px)</li>
              <li>Desktop (1200px)</li>
              <li>Responsive scaling</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>🔄 Real-time Updates</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>PostMessage communication</li>
              <li>Live config synchronization</li>
              <li>Cross-origin iframe support</li>
              <li>Instant visual feedback</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>🎯 Developer Tools</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>Viewport debugging</li>
              <li>Config inspection</li>
              <li>Refresh controls</li>
              <li>Error handling</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#fffbf0', border: '1px solid #f59e0b', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>⚡ Technical Implementation</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
            The Live Preview system uses iframe sandboxing with postMessage API for secure cross-origin communication. 
            It provides real-time updates between the admin interface (port 3001) and public preview (port 3000), 
            with responsive viewport simulation and configuration synchronization.
          </p>
        </div>
      </div>
    </AppProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comprehensive overview of the Live Preview system\'s features and technical implementation.',
      },
    },
  },
};