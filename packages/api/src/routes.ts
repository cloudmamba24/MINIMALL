/**
 * API route definitions
 */

export const API_ROUTES = {
  // Auth
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    session: '/api/auth/session',
    callback: '/api/auth/callback',
  },
  
  // Configs
  configs: {
    list: '/api/configs',
    get: (id: string) => `/api/configs/${id}`,
    create: '/api/configs',
    update: (id: string) => `/api/configs/${id}`,
    delete: (id: string) => `/api/configs/${id}`,
    publish: (id: string) => `/api/configs/${id}/publish`,
  },
  
  // Assets
  assets: {
    list: '/api/assets',
    upload: '/api/assets/upload',
    delete: (id: string) => `/api/assets/${id}`,
  },
  
  // Analytics
  analytics: {
    events: '/api/analytics/events',
    data: '/api/analytics/data',
    export: '/api/analytics/export',
  },
  
  // Webhooks
  webhooks: {
    shopify: '/api/webhooks/shopify',
  },
} as const;