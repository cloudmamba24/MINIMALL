'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { SiteConfig } from '@minimall/core';

interface SiteConfigContextValue {
  config: SiteConfig;
  shopDomain: string;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export interface SiteConfigProviderProps {
  config: SiteConfig;
  children: ReactNode;
}

export function SiteConfigProvider({ config, children }: SiteConfigProviderProps) {
  const value: SiteConfigContextValue = {
    config,
    shopDomain: config.settings.shopDomain,
  };

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
}

export function useShopDomain() {
  const context = useContext(SiteConfigContext);
  return context?.shopDomain || 'demo-shop.myshopify.com';
}