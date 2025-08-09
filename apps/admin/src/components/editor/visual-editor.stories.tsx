import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { VisualEditor } from './visual-editor';
import { AppProvider } from '@shopify/polaris';
import type { SiteConfig } from '@minimall/core';

// Mock Shopify Polaris theme
const mockTheme = {};

// Sample configuration data
const sampleConfig: SiteConfig = {
  id: 'sample-config',
  shop: 'demo-shop.myshopify.com',
  slug: 'sample-store',
  content: [
    {
      id: 'image-1',
      type: 'image',
      title: 'Hero Image',
      position: 1,
      isVisible: true,
      src: 'https://cdn.shopify.com/s/files/1/0262/4071/2726/files/sample-image.jpg',
      alt: 'Sample product image',
      width: 400,
      height: 300,
    },
    {
      id: 'product-1',
      type: 'product',
      title: 'Featured Product',
      position: 2,
      isVisible: true,
      productId: 'gid://shopify/Product/123456789',
      handle: 'sample-product',
      showPrice: true,
      showDescription: true,
    },
    {
      id: 'text-1',
      type: 'text',
      title: 'Welcome Message',
      position: 3,
      isVisible: true,
      content: 'Welcome to our amazing store! Check out our latest products.',
      style: {
        fontSize: 18,
        color: '#333333',
        textAlign: 'center',
      },
    },
  ],
  settings: {
    shopDomain: 'demo-shop.myshopify.com',
    theme: {
      primaryColor: '#2563eb',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
    },
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const emptyConfig: SiteConfig = {
  id: 'empty-config',
  shop: 'empty-shop.myshopify.com',
  slug: 'empty-store',
  content: [],
  settings: {
    shopDomain: 'empty-shop.myshopify.com',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const meta: Meta<typeof VisualEditor> = {
  title: 'Admin/Visual Editor',
  component: VisualEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A drag-and-drop visual editor for creating and managing link-in-bio site configurations. Supports multiple content types and real-time preview updates.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AppProvider i18n={{}}>
        <div style={{ padding: '1rem', minHeight: '600px' }}>
          <Story />
        </div>
      </AppProvider>
    ),
  ],
  argTypes: {
    config: {
      description: 'The site configuration object containing content items and settings',
    },
    onConfigChange: {
      description: 'Callback function called when the configuration is modified',
      action: 'config-changed',
    },
    onPreview: {
      description: 'Callback function called when preview should be updated',
      action: 'preview-requested',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    config: sampleConfig,
    onConfigChange: (config) => {
      console.log('Config changed:', config);
    },
    onPreview: (config) => {
      console.log('Preview requested:', config);
    },
  },
};

export const EmptyState: Story = {
  args: {
    config: emptyConfig,
    onConfigChange: (config) => {
      console.log('Config changed:', config);
    },
    onPreview: (config) => {
      console.log('Preview requested:', config);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'The editor in its empty state, showing the component palette and empty content area.',
      },
    },
  },
};

export const WithManyItems: Story = {
  args: {
    config: {
      ...sampleConfig,
      content: [
        ...sampleConfig.content!,
        {
          id: 'video-1',
          type: 'video',
          title: 'Product Video',
          position: 4,
          isVisible: true,
          src: 'https://example.com/video.mp4',
          thumbnail: 'https://example.com/thumb.jpg',
          autoplay: false,
        },
        {
          id: 'link-1',
          type: 'link',
          title: 'Shop Now',
          position: 5,
          isVisible: true,
          href: 'https://shop.example.com',
          target: '_blank',
          style: {
            buttonStyle: 'primary',
          },
        },
        {
          id: 'social-1',
          type: 'social',
          title: 'Follow Us',
          position: 6,
          isVisible: true,
          platform: 'instagram',
          username: '@shopexample',
          showFollowers: true,
        },
      ],
    },
    onConfigChange: (config) => {
      console.log('Config changed:', config);
    },
    onPreview: (config) => {
      console.log('Preview requested:', config);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'The editor with multiple content items demonstrating all supported content types.',
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [config, setConfig] = React.useState<SiteConfig>(sampleConfig);
    
    return (
      <div>
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Current Config:</strong>
          <pre style={{ fontSize: '12px', marginTop: '0.5rem' }}>
            {JSON.stringify({ 
              contentCount: config.content?.length || 0,
              lastUpdate: new Date().toLocaleTimeString()
            }, null, 2)}
          </pre>
        </div>
        <VisualEditor
          config={config}
          onConfigChange={(newConfig) => {
            console.log('Config updated:', newConfig);
            setConfig(newConfig);
          }}
          onPreview={(previewConfig) => {
            console.log('Preview updated:', previewConfig);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'An interactive version of the editor that responds to changes and updates the config in real-time.',
      },
    },
  },
};

// Component palette showcase
export const ComponentPalette: Story = {
  render: () => (
    <AppProvider i18n={{}}>
      <div style={{ padding: '1rem' }}>
        <h3>Available Content Types</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {[
            { type: 'image', label: 'Image', description: 'Add photos, artwork, or graphics', color: '#e3f2fd' },
            { type: 'video', label: 'Video', description: 'Embed videos or clips', color: '#f3e5f5' },
            { type: 'product', label: 'Product', description: 'Showcase products from your shop', color: '#e8f5e8' },
            { type: 'text', label: 'Text', description: 'Add headings, descriptions, or links', color: '#fff3e0' },
            { type: 'link', label: 'Link', description: 'External links and CTAs', color: '#fce4ec' },
            { type: 'social', label: 'Social', description: 'Social media links and feeds', color: '#e1f5fe' },
          ].map((component) => (
            <div key={component.type} style={{ 
              padding: '1rem', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              backgroundColor: component.color,
              textAlign: 'center' 
            }}>
              <strong>{component.label}</strong>
              <p style={{ fontSize: '14px', margin: '0.5rem 0 0 0' }}>{component.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AppProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of all available content types that can be added to a site configuration.',
      },
    },
  },
};