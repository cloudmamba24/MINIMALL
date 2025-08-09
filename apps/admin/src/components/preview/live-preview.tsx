'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, ButtonGroup, Select, Spinner, Text, Banner } from '@shopify/polaris';
import { RefreshIcon, ExternalIcon, MobileIcon, DesktopIcon, TabletIcon } from '@shopify/polaris-icons';
import type { SiteConfig } from '@minimall/core';

interface LivePreviewProps {
  config: SiteConfig;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

type ViewportSize = 'mobile' | 'tablet' | 'desktop';

interface ViewportDimensions {
  width: number;
  height: number;
  label: string;
}

const VIEWPORT_SIZES: Record<ViewportSize, ViewportDimensions> = {
  mobile: { width: 375, height: 812, label: 'iPhone 13 Pro' },
  tablet: { width: 768, height: 1024, label: 'iPad' },
  desktop: { width: 1200, height: 800, label: 'Desktop' },
};

export function LivePreview({ config, isLoading = false, error = null, onRefresh }: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate preview URL based on config
  useEffect(() => {
    if (config && config.id) {
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : window.location.origin.replace(':3001', ':3000'); // Admin is on 3001, public on 3000
      
      setPreviewUrl(`${baseUrl}/g/${config.id}?preview=true&timestamp=${Date.now()}`);
    }
  }, [config]);

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
    setPreviewError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeLoading(false);
    setPreviewError('Failed to load preview');
  }, []);

  // Send config updates to iframe via postMessage
  useEffect(() => {
    if (!iframeRef.current || !config || iframeLoading) return;

    const iframe = iframeRef.current;
    const targetOrigin = new URL(previewUrl).origin;

    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    // Send config with a small delay to ensure iframe is ready
    messageTimeoutRef.current = setTimeout(() => {
      try {
        iframe.contentWindow?.postMessage({
          type: 'CONFIG_UPDATE',
          config,
          timestamp: Date.now(),
        }, targetOrigin);
      } catch (error) {
        console.warn('Failed to send message to iframe:', error);
      }
    }, 100);

    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [config, previewUrl, iframeLoading]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const targetOrigin = previewUrl ? new URL(previewUrl).origin : window.location.origin;
      
      if (event.origin !== targetOrigin) return;

      switch (event.data.type) {
        case 'PREVIEW_READY':
          setIframeLoading(false);
          setPreviewError(null);
          break;
        case 'PREVIEW_ERROR':
          setIframeLoading(false);
          setPreviewError(event.data.error || 'Preview error occurred');
          break;
        case 'CONFIG_APPLIED':
          // Config was successfully applied in preview
          console.log('Config applied in preview:', event.data.timestamp);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [previewUrl]);

  const refreshPreview = useCallback(() => {
    if (iframeRef.current && previewUrl) {
      setIframeLoading(true);
      setPreviewError(null);
      iframeRef.current.src = `${previewUrl}&refresh=${Date.now()}`;
    }
    onRefresh?.();
  }, [previewUrl, onRefresh]);

  const openInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  }, [previewUrl]);

  const dimensions = VIEWPORT_SIZES[viewport];
  const scale = Math.min(1, (window.innerWidth - 100) / dimensions.width);

  if (!config || !config.id) {
    return (
      <Card title="Live Preview">
        <div className="p-8 text-center">
          <Text variant="bodyLg" color="subdued">
            No configuration selected for preview
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <Text variant="headingMd">Live Preview</Text>
            <Text variant="bodySm" color="subdued">
              {config.slug} • {dimensions.label}
            </Text>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Viewport selector */}
            <ButtonGroup segmented>
              <Button
                pressed={viewport === 'mobile'}
                onClick={() => setViewport('mobile')}
                icon={MobileIcon}
              />
              <Button
                pressed={viewport === 'tablet'}
                onClick={() => setViewport('tablet')}
                icon={TabletIcon}
              />
              <Button
                pressed={viewport === 'desktop'}
                onClick={() => setViewport('desktop')}
                icon={DesktopIcon}
              />
            </ButtonGroup>

            {/* Action buttons */}
            <ButtonGroup>
              <Button icon={RefreshIcon} onClick={refreshPreview}>
                Refresh
              </Button>
              <Button icon={ExternalIcon} onClick={openInNewTab}>
                Open
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {(error || previewError) && (
        <div className="p-4">
          <Banner tone="critical">
            {error || previewError}
          </Banner>
        </div>
      )}

      {/* Preview container */}
      <div className="p-4">
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
          {/* Loading overlay */}
          {(isLoading || iframeLoading) && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
              <div className="text-center">
                <Spinner size="large" />
                <Text variant="bodyMd">
                  {isLoading ? 'Loading configuration...' : 'Loading preview...'}
                </Text>
              </div>
            </div>
          )}

          {/* Preview iframe */}
          <div 
            className="mx-auto bg-white shadow-lg rounded-lg overflow-hidden"
            style={{
              width: dimensions.width * scale,
              height: dimensions.height * scale,
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'all 0.3s ease',
            }}
          >
            {previewUrl && (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                width={dimensions.width}
                height={dimensions.height}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="border-0"
                title={`Preview of ${config.slug}`}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            )}
          </div>

          {/* Preview info overlay */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded text-sm">
            {dimensions.width} × {dimensions.height}
            {scale < 1 && ` (${Math.round(scale * 100)}%)`}
          </div>
        </div>

        {/* Preview tips */}
        <div className="mt-4 text-center">
          <Text variant="bodySm" color="subdued">
            Changes are automatically reflected in the preview. Use the refresh button if updates don't appear.
          </Text>
        </div>
      </div>
    </Card>
  );
}