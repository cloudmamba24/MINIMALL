'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { SiteConfig } from '@minimall/core/client';
import { Renderer } from './renderer';

interface PreviewWrapperProps {
  initialConfig: SiteConfig;
  isPreview?: boolean;
}

export function PreviewWrapper({ initialConfig, isPreview = false }: PreviewWrapperProps) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Handle preview messages from admin
  useEffect(() => {
    if (!isPreview || typeof window === 'undefined') return;

    // Verify origin - should be from admin app
    const adminUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : window.location.origin.replace(':3000', ':3001');

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== adminUrl) return;

      switch (event.data.type) {
        case 'CONFIG_UPDATE':
          if (event.data.config && event.data.timestamp > lastUpdate) {
            console.log('Received config update from admin:', event.data.timestamp);
            setConfig(event.data.config);
            setLastUpdate(event.data.timestamp);
            
            // Send confirmation back to admin
            (event.source as Window)?.postMessage({
              type: 'CONFIG_APPLIED',
              timestamp: event.data.timestamp,
            }, adminUrl);
          }
          break;
      }
    };

    // Listen for messages
    window.addEventListener('message', handleMessage);
    
    // Send ready message to admin
    const sendReady = () => {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'PREVIEW_READY',
          timestamp: Date.now(),
        }, adminUrl);
      }
    };

    // Send ready message after a short delay
    setTimeout(sendReady, 100);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isPreview, lastUpdate]);

  // Add preview styling
  const previewStyles = isPreview ? {
    minHeight: '100vh',
    backgroundColor: 'var(--background)',
    position: 'relative' as const,
  } : {};

  return (
    <div style={previewStyles}>
      {isPreview && (
        <div 
          className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-1 text-sm z-50"
          style={{ fontSize: '12px' }}
        >
          Preview Mode • Updates automatically
        </div>
      )}
      <div style={isPreview ? { paddingTop: '32px' } : {}}>
        <Renderer config={config} />
      </div>
    </div>
  );
}