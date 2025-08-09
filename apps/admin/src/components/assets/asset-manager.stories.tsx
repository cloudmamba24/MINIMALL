import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { AssetManager } from './asset-manager';
import { AppProvider } from '@shopify/polaris';

// Mock asset data
const mockAssets = [
  {
    id: 'uploads/1704067200-image1.jpg',
    name: 'Hero Image',
    originalName: 'hero-banner.jpg',
    type: 'image' as const,
    mimeType: 'image/jpeg',
    size: 245760,
    url: 'https://picsum.photos/800/600?random=1',
    thumbnailUrl: 'https://picsum.photos/200/150?random=1',
    width: 800,
    height: 600,
    folder: 'uploads',
    tags: ['hero', 'banner', 'main'],
    uploadedAt: '2024-01-01T00:00:00Z',
    lastModified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'uploads/1704067260-video1.mp4',
    name: 'Product Demo',
    originalName: 'product-showcase.mp4',
    type: 'video' as const,
    mimeType: 'video/mp4',
    size: 5242880,
    url: 'https://example.com/video1.mp4',
    thumbnailUrl: 'https://picsum.photos/200/150?random=2',
    width: 1920,
    height: 1080,
    folder: 'uploads',
    tags: ['product', 'demo', 'video'],
    uploadedAt: '2024-01-01T01:00:00Z',
    lastModified: '2024-01-01T01:00:00Z',
  },
  {
    id: 'uploads/1704067320-doc1.pdf',
    name: 'Product Manual',
    originalName: 'manual.pdf',
    type: 'document' as const,
    mimeType: 'application/pdf',
    size: 1048576,
    url: 'https://example.com/manual.pdf',
    folder: 'uploads',
    tags: ['documentation', 'manual'],
    uploadedAt: '2024-01-01T02:00:00Z',
    lastModified: '2024-01-01T02:00:00Z',
  },
];

const largeAssetCollection = Array.from({ length: 24 }, (_, i) => ({
  id: `uploads/170406${7000 + i * 60}-image${i + 1}.jpg`,
  name: `Image ${i + 1}`,
  originalName: `photo-${i + 1}.jpg`,
  type: 'image' as const,
  mimeType: 'image/jpeg',
  size: Math.floor(Math.random() * 1000000) + 100000,
  url: `https://picsum.photos/800/600?random=${i + 10}`,
  thumbnailUrl: `https://picsum.photos/200/150?random=${i + 10}`,
  width: 800,
  height: 600,
  folder: 'uploads',
  tags: ['gallery', 'photo', `batch-${Math.floor(i / 6) + 1}`],
  uploadedAt: new Date(Date.now() - i * 3600000).toISOString(),
  lastModified: new Date(Date.now() - i * 3600000).toISOString(),
}));

const meta: Meta<typeof AssetManager> = {
  title: 'Admin/Asset Manager',
  component: AssetManager,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A comprehensive asset management system with drag-and-drop uploads, filtering, search, and cloud storage integration. Supports images, videos, and documents with metadata management.',
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
    onSelectAsset: {
      description: 'Callback when asset is selected',
      action: 'asset-selected',
    },
    allowMultiSelect: {
      description: 'Whether to allow multiple asset selection',
      control: 'boolean',
    },
    acceptedTypes: {
      description: 'Array of accepted file types',
      control: 'object',
    },
    maxFileSize: {
      description: 'Maximum file size in bytes',
      control: 'number',
    },
    folder: {
      description: 'Target folder for uploads',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    allowMultiSelect: true,
    acceptedTypes: ['image/*', 'video/*'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    folder: 'uploads',
  },
};

export const EmptyState: Story = {
  args: {
    allowMultiSelect: false,
    acceptedTypes: ['image/*'],
    folder: 'empty-test',
  },
  parameters: {
    docs: {
      description: {
        story: 'The asset manager in its empty state, showing the upload drop zone and empty message.',
      },
    },
  },
};

export const WithManyAssets: Story = {
  args: {
    allowMultiSelect: true,
    acceptedTypes: ['image/*', 'video/*'],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    folder: 'large-collection',
  },
  parameters: {
    docs: {
      description: {
        story: 'Asset manager with a large collection of assets demonstrating pagination, search, and filtering capabilities.',
      },
    },
  },
};

export const WithSelection: Story = {
  args: {
    allowMultiSelect: true,
    acceptedTypes: ['image/*'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    folder: 'selected-test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Asset manager with pre-selected assets, showing selection UI and bulk actions.',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  args: {
    allowMultiSelect: true,
    acceptedTypes: ['image/*', 'video/*'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    folder: 'interactive-demo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Fully interactive asset manager demonstrating real-time updates, file uploads, and asset management operations.',
      },
    },
  },
};

// Feature showcase stories
export const UploadFeatures: Story = {
  render: () => (
    <AppProvider i18n={{}}>
      <div style={{ padding: '1rem' }}>
        <h3>Asset Manager Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2563eb' }}>📁 File Management</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>Drag & drop file uploads</li>
              <li>Multiple file selection</li>
              <li>File type filtering</li>
              <li>Metadata editing</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#059669' }}>🔍 Organization</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>Search and filtering</li>
              <li>Tag-based organization</li>
              <li>Grid and list views</li>
              <li>Sorting options</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f8f9fa' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>☁️ Cloud Integration</h4>
            <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '14px' }}>
              <li>Cloudflare R2 storage</li>
              <li>Automatic thumbnails</li>
              <li>CDN optimization</li>
              <li>Secure file handling</li>
            </ul>
          </div>
        </div>
      </div>
    </AppProvider>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Overview of the asset manager\'s key features and capabilities.',
      },
    },
  },
};