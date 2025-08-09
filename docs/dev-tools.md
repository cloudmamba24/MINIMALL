# MINIMALL Developer Tools & Debugging Guide

## Table of Contents
- [Development Environment](#development-environment)
- [Debugging Tools](#debugging-tools)
- [Code Generation](#code-generation)
- [Testing Utilities](#testing-utilities)
- [Performance Monitoring](#performance-monitoring)
- [Error Handling](#error-handling)
- [API Documentation](#api-documentation)

## Development Environment

### Prerequisites
```bash
# Required versions
Node.js >= 18.0.0
npm >= 9.0.0
```

### Environment Setup
```bash
# Clone and install dependencies
git clone <repository>
cd MINIMALL
npm install

# Start development servers
npm run dev        # Starts all apps concurrently
npm run dev:admin  # Admin app only (port 3001)
npm run dev:public # Public app only (port 3000)
```

### Environment Variables
```bash
# .env.local
DATABASE_URL="postgresql://..."
SENTRY_DSN="https://..."
CLOUDFLARE_R2_ENDPOINT="..."
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_BUCKET_NAME="..."
```

## Debugging Tools

### 1. Browser DevTools Integration

#### React Developer Tools
- Install React DevTools browser extension
- Components tab shows component hierarchy
- Profiler tab for performance analysis

#### Sentry Integration
```typescript
// Error monitoring and debugging
import { captureException, captureMessage } from '@sentry/nextjs';

// Manual error reporting
try {
  // risky operation
} catch (error) {
  captureException(error, {
    tags: { section: 'visual-editor' },
    extra: { configId: 'demo-config' }
  });
}

// Debug messages
captureMessage('Debug: Config updated', {
  level: 'info',
  tags: { component: 'LivePreview' }
});
```

### 2. Console Debugging Utilities

#### Debug Configuration
```typescript
// Add to your component for debugging
const DEBUG = process.env.NODE_ENV === 'development';

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.group(`🔧 [DEBUG] ${message}`);
    if (data) console.log(data);
    console.trace();
    console.groupEnd();
  }
};

// Usage
debugLog('Config updated', newConfig);
```

#### Component State Inspector
```typescript
// React hook for debugging component state
function useDebugValue(value: any, label: string) {
  React.useDebugValue(value, (val) => `${label}: ${JSON.stringify(val)}`);
  
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 ${label}:`, value);
    }
  }, [value, label]);
  
  return value;
}

// Usage in components
function MyComponent() {
  const [state, setState] = useState(initialState);
  useDebugValue(state, 'MyComponent State');
  
  return <div>...</div>;
}
```

### 3. API Debugging

#### Request/Response Logging
```typescript
// API route debugging middleware
export function withDebugLogging(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();
    
    console.group(`🌐 API ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    // Intercept response
    const originalJson = res.json;
    res.json = function(data) {
      console.log('Response:', data);
      console.log(`⏱️ Duration: ${Date.now() - start}ms`);
      console.groupEnd();
      return originalJson.call(this, data);
    };
    
    return handler(req, res);
  };
}
```

## Code Generation

### 1. Component Generator
```bash
# Create new component with boilerplate
npx tsx scripts/generate-component.ts ComponentName
```

### 2. API Route Generator
```bash
# Create new API route with TypeScript types
npx tsx scripts/generate-api.ts route-name
```

### 3. Story Generator
```bash
# Generate Storybook stories for existing components
npx tsx scripts/generate-stories.ts ComponentName
```

### Generation Scripts

#### Component Generator (`scripts/generate-component.ts`)
```typescript
#!/usr/bin/env tsx
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const componentName = process.argv[2];
if (!componentName) {
  console.error('Please provide a component name');
  process.exit(1);
}

const componentDir = join(process.cwd(), 'packages/ui/src/components', componentName.toLowerCase());
mkdirSync(componentDir, { recursive: true });

// Generate component file
const componentCode = `import React from 'react';
import { cn } from '../lib/utils';

interface ${componentName}Props {
  className?: string;
  children?: React.ReactNode;
}

export const ${componentName} = React.forwardRef<
  HTMLDivElement,
  ${componentName}Props
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("", className)}
      {...props}
    >
      {children}
    </div>
  );
});

${componentName}.displayName = "${componentName}";
`;

writeFileSync(join(componentDir, `${componentName.toLowerCase()}.tsx`), componentCode);

// Generate test file
const testCode = `import { render, screen } from '@testing-library/react';
import { ${componentName} } from './${componentName.toLowerCase()}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName}>Test content</${componentName}>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
`;

writeFileSync(join(componentDir, `${componentName.toLowerCase()}.test.tsx`), testCode);

console.log(`✅ Generated ${componentName} component in ${componentDir}`);
```

## Testing Utilities

### 1. Test Setup and Helpers

#### Shared Test Utilities
```typescript
// packages/core/src/test-setup/test-utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AppProvider } from '@shopify/polaris';

// Custom render with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppProvider i18n={{}}>
        {children}
      </AppProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock factories
export const createMockConfig = (overrides = {}) => ({
  id: 'test-config',
  shop: 'test-shop.myshopify.com',
  slug: 'test-slug',
  content: [],
  settings: { shopDomain: 'test-shop.myshopify.com' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAsset = (overrides = {}) => ({
  id: 'test-asset',
  name: 'Test Asset',
  originalName: 'test.jpg',
  type: 'image' as const,
  mimeType: 'image/jpeg',
  size: 1024,
  url: 'https://example.com/test.jpg',
  folder: 'uploads',
  tags: [],
  uploadedAt: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-01T00:00:00Z',
  ...overrides,
});
```

### 2. Integration Test Helpers
```typescript
// Test API endpoints
export async function testApiEndpoint(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) {
  const response = await fetch(`http://localhost:3001/api${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    data: await response.json(),
  };
}

// Example usage in tests
describe('Config API', () => {
  it('should get config by ID', async () => {
    const result = await testApiEndpoint('/configs/test-config');
    expect(result.status).toBe(200);
    expect(result.data.success).toBe(true);
  });
});
```

## Performance Monitoring

### 1. Web Vitals Debugging
```typescript
// Custom Web Vitals debugging
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function debugWebVitals() {
  const vitals: Record<string, number> = {};
  
  getCLS((metric) => {
    vitals.CLS = metric.value;
    console.log('🎯 CLS:', metric);
  });
  
  getFID((metric) => {
    vitals.FID = metric.value;
    console.log('🎯 FID:', metric);
  });
  
  getLCP((metric) => {
    vitals.LCP = metric.value;
    console.log('🎯 LCP:', metric);
  });
  
  // Log summary after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.table(vitals);
    }, 1000);
  });
}

// Call in development
if (process.env.NODE_ENV === 'development') {
  debugWebVitals();
}
```

### 2. Bundle Analysis
```bash
# Analyze bundle size
npm run analyze

# View detailed bundle report
npx @next/bundle-analyzer
```

## Error Handling

### 1. Error Boundary with Debugging
```typescript
// Enhanced error boundary for debugging
import React from 'react';
import * as Sentry from '@sentry/nextjs';

interface DebugErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class DebugErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<any> },
  DebugErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Enhanced error logging in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Stack:', error.stack);
      console.groupEnd();
    }
    
    // Report to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      return FallbackComponent ? (
        <FallbackComponent error={this.state.error} />
      ) : (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error Details (Development)</summary>
              <pre>{this.state.error?.stack}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. API Error Debugging
```typescript
// API error handling with detailed logging
export function createApiError(message: string, status = 500, details?: any) {
  const error = new Error(message);
  
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 API Error (${status})`);
    console.error('Message:', message);
    if (details) console.error('Details:', details);
    console.trace();
    console.groupEnd();
  }
  
  return { error: message, status, details };
}
```

## API Documentation

The comprehensive API documentation is available at:
- **OpenAPI Spec**: `/docs/api/openapi.yaml`
- **Swagger UI**: `http://localhost:3001/api/docs` (when running)

### Quick API Testing
```bash
# Test configuration endpoint
curl -X GET http://localhost:3001/api/configs/demo-config

# Test asset upload
curl -X POST http://localhost:3001/api/assets/upload \
  -F "file=@image.jpg" \
  -F "folder=uploads"

# Test analytics
curl -X GET "http://localhost:3001/api/analytics/data?timeframe=24h"
```

## Visual Debugging with Storybook

```bash
# Start Storybook for component development
npm run storybook

# Build static Storybook
npm run build-storybook
```

### Custom Debug Tools in Stories
```typescript
// Add debug controls to stories
export const WithDebugTools: Story = {
  render: () => {
    const [debugMode, setDebugMode] = useState(false);
    
    return (
      <div>
        <label>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          Debug Mode
        </label>
        <Component debugMode={debugMode} />
      </div>
    );
  },
};
```

This developer tools guide provides comprehensive debugging, testing, and development utilities for the MINIMALL platform. Use these tools to efficiently develop, debug, and maintain the codebase.