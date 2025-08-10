# Debugging & Troubleshooting - Production-Ready Solutions

This guide contains all the debugging knowledge and troubleshooting patterns you wish you had during development. Every issue covered here is based on real-world problems developers face when building sophisticated applications.

## 🚨 **Critical Production Issues**

### **Next.js Common Failures**

#### **Hydration Mismatches (The #1 Next.js Issue)**
```typescript
// ❌ Common cause - server/client rendering differences
const BadComponent = () => {
  const [mounted, setMounted] = useState(false)
  
  // This causes hydration mismatch!
  return (
    <div>
      {Math.random() > 0.5 ? 'A' : 'B'}  {/* Different on server vs client */}
      {new Date().toLocaleString()}        {/* Time difference */}
      {typeof window !== 'undefined' && window.innerWidth} {/* Server has no window */}
    </div>
  )
}

// ✅ Solution - Ensure consistent rendering
const GoodComponent = () => {
  const [mounted, setMounted] = useState(false)
  const [randomValue, setRandomValue] = useState('')
  
  useEffect(() => {
    setMounted(true)
    setRandomValue(Math.random() > 0.5 ? 'A' : 'B')
  }, [])
  
  if (!mounted) {
    return <div>Loading...</div> // Consistent server/client
  }
  
  return <div>{randomValue}</div>
}

// ✅ Alternative - Use dynamic imports with ssr: false
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
)
```

#### **Build Failures & Deployment Issues**
```typescript
// ❌ Common build failure causes
// 1. Missing environment variables
console.log(process.env.MISSING_VAR) // Fails in build

// 2. Server-only code in client components
'use client'
import fs from 'fs' // ❌ fs not available in browser

// 3. Missing async/await in data fetching
export default function Page() {
  const data = fetch('/api/data') // ❌ Missing await
  return <div>{data}</div>
}

// ✅ Solutions
// 1. Environment variable validation
const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'STRIPE_SECRET_KEY']

function validateEnvVars() {
  const missing = requiredEnvVars.filter(key => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`)
  }
}

// Call in next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Validate env vars at build time
  env: (() => {
    validateEnvVars()
    return {}
  })(),
}

// 2. Proper server/client separation
// utils/server-only.ts
import 'server-only' // Throws error if imported on client
export const serverOnlyFunction = () => { /* server code */ }

// 3. Proper async data fetching
export default async function Page() {
  const data = await fetch('/api/data').then(r => r.json())
  return <div>{JSON.stringify(data)}</div>
}
```

#### **API Route Debugging**
```typescript
// ✅ Comprehensive error handling for API routes
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const requestSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request method and content type
    const contentType = request.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    // 2. Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const validatedData = requestSchema.parse(body)

    // 3. Business logic with proper error handling
    const result = await addToCart(validatedData)
    
    // 4. Success response with proper headers
    return NextResponse.json(result, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    })

  } catch (error) {
    // 5. Comprehensive error logging
    console.error('API Error:', {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    })

    // 6. Return appropriate error responses
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    if (error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### **TypeScript Debugging Patterns**

#### **Type Error Debugging**
```typescript
// ❌ Common type issues that cause builds to fail

// 1. Any types creeping in
function processData(data: any) { // ❌ Loses type safety
  return data.nonExistentProperty
}

// 2. Missing null checks
function getUserName(user: User | null) {
  return user.name // ❌ user might be null
}

// 3. Incorrect generic constraints
function updateProduct<T>(product: T, updates: Partial<T>) {
  return { ...product, ...updates } // ❌ T might not be an object
}

// ✅ Solutions

// 1. Strict typing with proper error handling
function processData(data: ProductData): ProcessedData {
  if (!isValidProductData(data)) {
    throw new Error('Invalid product data structure')
  }
  return transformData(data)
}

// Type guard
function isValidProductData(data: unknown): data is ProductData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'title' in data
  )
}

// 2. Null safety with proper checks
function getUserName(user: User | null): string {
  if (!user) {
    return 'Anonymous User'
  }
  return user.name ?? 'Unnamed User'
}

// 3. Proper generic constraints
function updateProduct<T extends Record<string, unknown>>(
  product: T,
  updates: Partial<T>
): T {
  return { ...product, ...updates }
}

// ✅ Advanced debugging - Type utilities for complex scenarios
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

type SafeAccess<T, K extends keyof T> = T[K] extends undefined ? never : T[K]

// Debug complex types
type DebugType<T> = T extends (...args: any[]) => infer R
  ? { function: true; returns: R }
  : T extends object
  ? { object: true; keys: keyof T }
  : { primitive: true; type: T }

type ProductDebug = DebugType<Product> // Helps understand complex types
```

#### **TypeScript Performance Issues**
```typescript
// ✅ TypeScript compilation optimization

// tsconfig.json optimizations for large projects
{
  "compilerOptions": {
    "incremental": true,                    // Enable incremental compilation
    "tsBuildInfoFile": ".tsbuildinfo",     // Cache compilation info
    "skipLibCheck": true,                   // Skip type checking of declaration files
    "skipDefaultLibCheck": true,           // Skip default lib files
    "isolatedModules": true,               // Enable faster transpilation
    "importsNotUsedAsValues": "error",     // Remove unused imports
    "verbatimModuleSyntax": true,          // Faster module resolution
  },
  "include": ["src/**/*"],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}

// Project references for monorepos
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,                     // Enable project references
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "references": [
    { "path": "../shared" },
    { "path": "../types" }
  ]
}
```

---

## 🔌 **tRPC Debugging Patterns**

### **Type Mismatch Issues**
```typescript
// ❌ Common tRPC issues

// 1. Client/server type sync issues
const router = createTRPCRouter({
  getProduct: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      // Returns different type than expected
      return { id: input } // Client expects full Product
    }),
})

// 2. Context type issues
const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  // ❌ ctx.user might not exist
  console.log(ctx.user.id)
  return next({ ctx: { ...ctx, user: ctx.user } })
})

// ✅ Solutions

// 1. Proper input/output validation
const router = createTRPCRouter({
  getProduct: publicProcedure
    .input(z.object({ id: z.string() }))
    .output(z.object({
      id: z.string(),
      title: z.string(),
      price: z.number(),
    }))
    .query(async ({ input }) => {
      const product = await getProductById(input.id)
      if (!product) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Product not found',
        })
      }
      return product // Now type-safe
    }),
})

// 2. Proper middleware with type guards
const authMiddleware = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user }, // Now guaranteed to exist
    },
  })
})

const protectedProcedure = publicProcedure.use(authMiddleware)
```

### **Performance Issues**
```typescript
// ✅ tRPC performance optimization

// 1. Efficient data fetching with proper caching
const router = createTRPCRouter({
  getProducts: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { limit, cursor } = input
      
      // Use database-level pagination
      const products = await ctx.db.product.findMany({
        take: limit + 1, // Get one extra to determine if there's a next page
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          variants: {
            take: 5, // Limit related data
          },
        },
      })
      
      let nextCursor: string | undefined = undefined
      if (products.length > limit) {
        const nextItem = products.pop()
        nextCursor = nextItem!.id
      }
      
      return {
        products,
        nextCursor,
      }
    }),
})

// 2. Request batching configuration
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      // Batch multiple requests
      maxBatchSize: 10,
      // Add request deduplication
      maxURLLength: 2048,
    }),
  ],
})

// 3. Intelligent caching on the client
const ProductList = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
  } = trpc.products.getProducts.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      // Cache for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep in cache for 30 minutes
      cacheTime: 30 * 60 * 1000,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
    }
  )
  
  return (
    <div>
      {data?.pages.map((page) =>
        page.products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      )}
    </div>
  )
}
```

---

## 🗄️ **Database & ORM Debugging**

### **Drizzle ORM Issues**
```typescript
// ✅ Database debugging and optimization

// 1. Query logging for development
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(connectionString, {
  debug: process.env.NODE_ENV === 'development', // Log SQL queries
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
})

const db = drizzle(client, {
  logger: process.env.NODE_ENV === 'development' ? {
    logQuery: (query, params) => {
      console.log('🔍 SQL Query:', query)
      console.log('📋 Parameters:', params)
      console.time(`Query-${query.slice(0, 50)}`)
    }
  } : false,
})

// 2. Query optimization patterns
// ❌ N+1 query problem
const badGetProducts = async () => {
  const products = await db.select().from(productsTable)
  
  for (const product of products) {
    // This creates N additional queries!
    const variants = await db.select()
      .from(variantsTable)
      .where(eq(variantsTable.productId, product.id))
    product.variants = variants
  }
  
  return products
}

// ✅ Proper joins and relations
const goodGetProducts = async () => {
  return await db.query.products.findMany({
    with: {
      variants: true, // Single query with JOIN
      reviews: {
        limit: 3,
        orderBy: desc(reviewsTable.createdAt),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })
}

// 3. Connection debugging
const debugConnection = async () => {
  try {
    await db.select().from(productsTable).limit(1)
    console.log('✅ Database connection successful')
  } catch (error) {
    console.error('❌ Database connection failed:', {
      message: error.message,
      code: error.code,
      host: process.env.DATABASE_HOST,
      database: process.env.DATABASE_NAME,
    })
    
    // Common connection issues
    if (error.code === 'ENOTFOUND') {
      console.error('🔍 DNS resolution failed - check DATABASE_HOST')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Connection refused - check if database is running')
    } else if (error.code === '28P01') {
      console.error('🔍 Authentication failed - check credentials')
    }
    
    throw error
  }
}

// 4. Migration debugging
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const runMigrations = async () => {
  try {
    console.log('🔄 Running migrations...')
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('✅ Migrations completed')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    
    // Check for common migration issues
    if (error.message.includes('relation already exists')) {
      console.error('🔍 Table already exists - check migration order')
    } else if (error.message.includes('column does not exist')) {
      console.error('🔍 Column reference error - check schema changes')
    }
    
    throw error
  }
}
```

### **Performance Monitoring**
```typescript
// ✅ Database performance monitoring

class DatabaseMonitor {
  private static queryTimes = new Map<string, number[]>()
  
  static startQuery(queryId: string) {
    return performance.now()
  }
  
  static endQuery(queryId: string, startTime: number, query: string) {
    const duration = performance.now() - startTime
    
    if (!this.queryTimes.has(queryId)) {
      this.queryTimes.set(queryId, [])
    }
    this.queryTimes.get(queryId)!.push(duration)
    
    // Log slow queries
    if (duration > 1000) {
      console.warn('🐌 Slow query detected:', {
        duration: `${duration.toFixed(2)}ms`,
        query: query.slice(0, 100) + '...',
        queryId,
      })
    }
    
    // Alert on consistently slow queries
    const times = this.queryTimes.get(queryId)!
    if (times.length >= 10) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      if (avgTime > 500) {
        console.error('🚨 Consistently slow query:', {
          queryId,
          averageTime: `${avgTime.toFixed(2)}ms`,
          executions: times.length,
        })
      }
      // Reset after analysis
      this.queryTimes.set(queryId, [])
    }
  }
  
  static getSlowQueries() {
    return Array.from(this.queryTimes.entries())
      .map(([queryId, times]) => ({
        queryId,
        averageTime: times.reduce((a, b) => a + b, 0) / times.length,
        executions: times.length,
      }))
      .filter(q => q.averageTime > 200)
      .sort((a, b) => b.averageTime - a.averageTime)
  }
}

// Usage in queries
const getProductWithMonitoring = async (productId: string) => {
  const queryId = 'get-product-by-id'
  const startTime = DatabaseMonitor.startQuery(queryId)
  
  try {
    const result = await db.query.products.findFirst({
      where: eq(productsTable.id, productId),
      with: { variants: true },
    })
    
    return result
  } finally {
    DatabaseMonitor.endQuery(queryId, startTime, 'SELECT products with variants')
  }
}
```

---

## 🔧 **Build & Deployment Issues**

### **Package Manager Debugging**
```typescript
// ✅ pnpm/npm debugging solutions

// 1. Dependency resolution issues
// package.json
{
  "pnpm": {
    "overrides": {
      // Fix version conflicts
      "react": "18.2.0",
      "@types/react": "18.2.0"
    },
    "peerDependencyRules": {
      // Allow missing peer deps for specific packages
      "ignoreMissing": ["@babel/core"],
      "allowAny": ["react", "react-dom"]
    }
  },
  "resolutions": {
    // npm/yarn equivalent
    "react": "18.2.0"
  }
}

// 2. Workspace configuration debugging
// pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'
  
// .npmrc for debugging
shamefully-hoist=true          # Hoist dependencies to root
auto-install-peers=true        # Auto install peer deps
strict-peer-dependencies=false # Allow peer dep mismatches in dev

// 3. Lock file issues
const fixLockfileIssues = async () => {
  console.log('🔧 Fixing dependency issues...')
  
  // Commands to run when dependencies are broken
  const commands = [
    'rm -rf node_modules',
    'rm pnpm-lock.yaml', // or package-lock.json
    'pnpm install --frozen-lockfile=false',
    'pnpm dedupe', // Remove duplicate dependencies
  ]
  
  for (const cmd of commands) {
    console.log(`Running: ${cmd}`)
    // Execute command
  }
}
```

### **CI/CD Debugging**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  debug-environment:
    runs-on: ubuntu-latest
    steps:
      - name: Debug Environment
        run: |
          echo "Node version: $(node --version)"
          echo "npm version: $(npm --version)"
          echo "pnpm version: $(pnpm --version)"
          echo "Available memory: $(free -h)"
          echo "Disk space: $(df -h)"
          echo "CPU info: $(nproc)"
          
      - name: Debug Environment Variables
        run: |
          echo "NODE_ENV: $NODE_ENV"
          echo "CI: $CI"
          echo "GITHUB_SHA: $GITHUB_SHA"
          # Don't echo secrets!
          echo "Has DATABASE_URL: ${{ secrets.DATABASE_URL != '' }}"
          echo "Has NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET != '' }}"

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Debug Dependencies
        run: |
          echo "Package.json exists: $(test -f package.json && echo 'yes' || echo 'no')"
          echo "Lock file exists: $(test -f pnpm-lock.yaml && echo 'yes' || echo 'no')"
          
      - name: Install dependencies
        run: |
          pnpm install --frozen-lockfile
          # Debug installed packages
          pnpm list --depth=0
          
      - name: Debug Build Environment
        run: |
          echo "Build environment variables:"
          printenv | grep -E '^(NODE_ENV|NEXT_|DATABASE_|NEXTAUTH_)' || echo "No matching env vars"
          
      - name: Type Check
        run: pnpm run type-check
        
      - name: Lint
        run: pnpm run lint
        
      - name: Test
        run: pnpm run test --passWithNoTests
        
      - name: Build
        run: |
          echo "Starting build process..."
          pnpm run build
          echo "Build completed successfully"
          
      - name: Debug Build Output
        run: |
          echo "Build directory contents:"
          ls -la .next/ || echo "No .next directory found"
          echo "Build size:"
          du -sh .next/ || echo "Cannot measure build size"

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
```

### **Environment Variable Debugging**
```typescript
// ✅ Environment validation and debugging

// lib/env-validation.ts
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_HOST: z.string().optional(),
  DATABASE_NAME: z.string().optional(),
  
  // Auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // External APIs
  SHOPIFY_DOMAIN: z.string().min(1),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  
  // Optional
  SENTRY_DSN: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
})

export const env = (() => {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Environment validation failed:')
    
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
        
        // Helpful debugging info
        const envKey = err.path[0] as string
        const currentValue = process.env[envKey]
        
        if (!currentValue) {
          console.error(`    Current value: undefined`)
          console.error(`    💡 Check your .env.local file or deployment environment`)
        } else if (err.code === 'invalid_string' && err.validation === 'url') {
          console.error(`    Current value: "${currentValue}"`)
          console.error(`    💡 Must be a valid URL (include http:// or https://)`)
        } else if (err.code === 'too_small') {
          console.error(`    Current value length: ${currentValue.length}`)
          console.error(`    💡 Minimum length required: ${err.minimum}`)
        }
      })
    }
    
    process.exit(1)
  }
})()

// Environment debugging utility
export const debugEnvironment = () => {
  console.log('🔍 Environment Debug Info:')
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`Platform: ${process.platform}`)
  console.log(`Node version: ${process.version}`)
  
  const sensitiveKeys = ['SECRET', 'KEY', 'TOKEN', 'PASSWORD']
  
  Object.entries(process.env)
    .filter(([key]) => key.startsWith('NEXT_') || key.startsWith('DATABASE_'))
    .forEach(([key, value]) => {
      const isSensitive = sensitiveKeys.some(sensitive => key.includes(sensitive))
      console.log(`${key}: ${isSensitive ? '[REDACTED]' : value}`)
    })
}

// Call in next.config.js to validate at build time
if (process.env.NODE_ENV !== 'production') {
  debugEnvironment()
}
```

---

## 🔍 **Production Debugging Tools**

### **Error Boundary with Detailed Logging**
```typescript
'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  eventId?: string
}

export class ProductionErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary Caught Error:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      timestamp: new Date().toISOString(),
    })

    // Send to error tracking service
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: errorInfo,
      },
      tags: {
        section: 'error-boundary',
      },
    })

    this.setState({
      error,
      errorInfo,
      eventId,
    })

    // Send to your own logging service
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        eventId,
        metadata: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      }),
    }).catch(console.error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details (for debugging)</summary>
            <pre>{this.state.error?.stack}</pre>
            {this.state.eventId && (
              <p>Error ID: {this.state.eventId}</p>
            )}
          </details>
          <button
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

### **Performance Monitoring**
```typescript
// ✅ Performance monitoring and debugging

class PerformanceMonitor {
  private static measurements = new Map<string, number[]>()
  
  // Monitor component render times
  static measureRender<T extends React.ComponentType<any>>(
    Component: T,
    displayName?: string
  ): T {
    const WrappedComponent = React.forwardRef((props, ref) => {
      const name = displayName || Component.displayName || Component.name || 'Anonymous'
      
      const startTime = React.useRef<number>(0)
      
      React.useLayoutEffect(() => {
        startTime.current = performance.now()
      })
      
      React.useLayoutEffect(() => {
        const duration = performance.now() - startTime.current
        this.recordMeasurement(`render-${name}`, duration)
        
        if (duration > 100) { // Log slow renders
          console.warn(`🐌 Slow render: ${name} took ${duration.toFixed(2)}ms`)
        }
      })
      
      return React.createElement(Component, { ...props, ref })
    })
    
    WrappedComponent.displayName = `PerformanceMonitor(${displayName})`
    return WrappedComponent as T
  }
  
  // Monitor async operations
  static async measureAsync<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await operation()
      const duration = performance.now() - startTime
      
      this.recordMeasurement(`async-${operationName}`, duration)
      
      if (duration > 2000) {
        console.warn(`🐌 Slow async operation: ${operationName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`❌ Failed async operation: ${operationName} failed after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
  
  private static recordMeasurement(name: string, duration: number) {
    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    
    const measurements = this.measurements.get(name)!
    measurements.push(duration)
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift()
    }
  }
  
  static getPerformanceReport() {
    const report = Array.from(this.measurements.entries()).map(([name, measurements]) => {
      const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length
      const max = Math.max(...measurements)
      const min = Math.min(...measurements)
      
      return {
        operation: name,
        count: measurements.length,
        average: Number(avg.toFixed(2)),
        max: Number(max.toFixed(2)),
        min: Number(min.toFixed(2)),
      }
    })
    
    return report.sort((a, b) => b.average - a.average)
  }
}

// Usage
const OptimizedProductCard = PerformanceMonitor.measureRender(ProductCard, 'ProductCard')

const fetchProductData = async (id: string) => {
  return PerformanceMonitor.measureAsync(
    async () => {
      const response = await fetch(`/api/products/${id}`)
      return response.json()
    },
    `fetch-product-${id}`
  )
}
```

---

## 🚨 **Emergency Debugging Checklist**

### **When Everything Breaks in Production**

```markdown
## 🚨 Production Emergency Checklist

### Immediate Actions (First 5 minutes)
- [ ] Check error monitoring dashboard (Sentry/Datadog)
- [ ] Verify deployment status and recent changes
- [ ] Check server status and resource usage
- [ ] Review recent commits for obvious issues
- [ ] Check external service status (Vercel, DB, APIs)

### Investigation (Next 15 minutes)
- [ ] Enable debug logging temporarily
- [ ] Check application logs for patterns
- [ ] Verify environment variables are correct
- [ ] Test critical user paths manually
- [ ] Check database connectivity and performance

### Communication
- [ ] Notify stakeholders of issue
- [ ] Create incident tracking ticket
- [ ] Prepare status page update if needed

### Resolution
- [ ] Identify root cause
- [ ] Implement fix or rollback
- [ ] Verify fix resolves issue
- [ ] Monitor for recurring problems
- [ ] Document incident and prevention steps

### Common Quick Fixes
- [ ] Restart application servers
- [ ] Clear caches (Redis, CDN, application)
- [ ] Rollback to last known good deployment
- [ ] Scale up resources if performance issue
- [ ] Check and refresh API keys/tokens
```

This comprehensive debugging guide covers the real-world issues that cause the most pain during development and deployment. Keep this handy - it will save you hours of debugging time!