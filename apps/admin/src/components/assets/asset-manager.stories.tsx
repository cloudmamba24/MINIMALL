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
    assets: {
      description: 'Array of asset objects to display in the manager',
    },
    selectedAssets: {
      description: 'Array of currently selected asset IDs',
    },
    onSelectionChange: {
      description: 'Callback when asset selection changes',
      action: 'selection-changed',
    },
    onUpload: {
      description: 'Callback when files are uploaded',
      action: 'files-uploaded',
    },
    onUpdate: {
      description: 'Callback when asset metadata is updated',
      action: 'asset-updated',
    },
    onDelete: {
      description: 'Callback when assets are deleted',
      action: 'assets-deleted',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    assets: mockAssets,
    selectedAssets: [],
    onSelectionChange: (assets) => {
      console.log('Selection changed:', assets);
    },
    onUpload: (files) => {
      console.log('Files uploaded:', files);
    },
    onUpdate: (assetId, updates) => {
      console.log('Asset updated:', assetId, updates);
    },
    onDelete: (assetIds) => {
      console.log('Assets deleted:', assetIds);
    },
  },
};

export const EmptyState: Story = {
  args: {
    assets: [],
    selectedAssets: [],
    onSelectionChange: (assets) => {
      console.log('Selection changed:', assets);
    },
    onUpload: (files) => {
      console.log('Files uploaded:', files);
    },
    onUpdate: (assetId, updates) => {
      console.log('Asset updated:', assetId, updates);
    },
    onDelete: (assetIds) => {
      console.log('Assets deleted:', assetIds);
    },
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
    assets: largeAssetCollection,
    selectedAssets: [],
    onSelectionChange: (assets) => {
      console.log('Selection changed:', assets);
    },
    onUpload: (files) => {
      console.log('Files uploaded:', files);
    },
    onUpdate: (assetId, updates) => {
      console.log('Asset updated:', assetId, updates);
    },
    onDelete: (assetIds) => {
      console.log('Assets deleted:', assetIds);
    },
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
    assets: mockAssets,
    selectedAssets: [mockAssets[0].id, mockAssets[2].id],
    onSelectionChange: (assets) => {
      console.log('Selection changed:', assets);
    },
    onUpload: (files) => {
      console.log('Files uploaded:', files);
    },
    onUpdate: (assetId, updates) => {
      console.log('Asset updated:', assetId, updates);
    },
    onDelete: (assetIds) => {
      console.log('Assets deleted:', assetIds);
    },
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
  render: () => {
    const [assets, setAssets] = React.useState(mockAssets);
    const [selectedAssets, setSelectedAssets] = React.useState<string[]>([]);

    return (
      <div>
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
          <strong>Current State:</strong>
          <div style={{ fontSize: '12px', marginTop: '0.5rem' }}>
            Total Assets: {assets.length} | Selected: {selectedAssets.length}
          </div>
          {selectedAssets.length > 0 && (
            <div style={{ fontSize: '12px', marginTop: '0.25rem', color: '#666' }}>
              Selected: {selectedAssets.join(', ')}
            </div>
          )}
        </div>
        <AssetManager
          assets={assets}
          selectedAssets={selectedAssets}
          onSelectionChange={setSelectedAssets}
          onUpload={(files) => {
            console.log('Simulating upload of:', files.map(f => f.name));
            // Simulate adding uploaded files
            const newAssets = files.map((file, index) => ({
              id: `uploads/${Date.now() + index}-${file.name}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              originalName: file.name,
              type: file.type.startsWith('image/') ? 'image' as const :
                   file.type.startsWith('video/') ? 'video' as const : 'document' as const,
              mimeType: file.type,
              size: file.size,
              url: URL.createObjectURL(file),
              thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
              folder: 'uploads',
              tags: [],
              uploadedAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
            }));
            setAssets(prev => [...prev, ...newAssets]);
          }}
          onUpdate={(assetId, updates) => {
            console.log('Updating asset:', assetId, updates);
            setAssets(prev => prev.map(asset => 
              asset.id === assetId 
                ? { ...asset, ...updates, lastModified: new Date().toISOString() }
                : asset
            ));
          }}
          onDelete={(assetIds) => {
            console.log('Deleting assets:', assetIds);
            setAssets(prev => prev.filter(asset => !assetIds.includes(asset.id)));
            setSelectedAssets(prev => prev.filter(id => !assetIds.includes(id)));
          }}
        />
      </div>
    );
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