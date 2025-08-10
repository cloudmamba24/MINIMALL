# Core Frameworks - Foundation Technologies

This guide covers the foundational technologies that power modern sophisticated web applications. These are your building blocks for MINIMALL and similar platforms.

## ⚛️ **React 18+ Concurrent Features**

### **Modern React Patterns for Performance**

```typescript
'use client'

import { Suspense, lazy, startTransition, useDeferredValue, useOptimistic, use } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

// Revolutionary concurrent rendering patterns
const LazyProductGrid = lazy(() => import('@/components/ProductGrid'))
const LazyAnalyticsDashboard = lazy(() => import('@/components/AnalyticsDashboard'))

export const ModernReactApp = () => {
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState('')
  const deferredQuery = useDeferredValue(searchQuery)
  
  // Optimistic updates for instant UI feedback
  const [optimisticProducts, addOptimisticProduct] = useOptimistic(
    products,
    (state, newProduct) => [...state, newProduct]
  )

  const handleSearch = (query: string) => {
    startTransition(() => {
      setSearchQuery(query)
      // Non-urgent update won't block UI
    })
  }

  const handleAddProduct = async (product: Product) => {
    // Optimistically update UI immediately
    addOptimisticProduct(product)
    
    try {
      await addProductMutation.mutateAsync(product)
    } catch (error) {
      // UI will automatically revert on error
      toast.error('Failed to add product')
    }
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className="app-container">
        {/* Search with deferred updates */}
        <SearchInput 
          onChange={handleSearch}
          pending={isPending}
        />
        
        {/* Concurrent rendering with Suspense boundaries */}
        <Suspense fallback={<ProductGridSkeleton />}>
          <LazyProductGrid 
            searchQuery={deferredQuery}
            products={optimisticProducts}
            onAddProduct={handleAddProduct}
          />
        </Suspense>
        
        <Suspense fallback={<AnalyticsSkeleton />}>
          <LazyAnalyticsDashboard />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

// Revolutionary server component data fetching
async function ServerProductList({ category }: { category: string }) {
  // This runs on the server
  const products = await fetchProducts(category)
  
  return (
    <div className="product-list">
      {products.map(product => (
        <Suspense key={product.id} fallback={<ProductCardSkeleton />}>
          <ProductCard product={product} />
        </Suspense>
      ))}
    </div>
  )
}

// Error boundaries with monitoring
const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  useEffect(() => {
    // Log to monitoring service
    console.error('React Error Boundary:', error)
    
    // Send to Sentry or similar
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error)
    }
  }, [error])

  return (
    <div className="error-boundary">
      <h2>Something went wrong</h2>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}
```

### **Performance Optimization Patterns**

```typescript
import { memo, useMemo, useCallback, useRef } from 'react'

// Memoization for expensive components
const ProductCard = memo(({ product, onAddToCart }: ProductCardProps) => {
  // Memoize expensive calculations
  const discountPercentage = useMemo(() => {
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
  }, [product.originalPrice, product.price])

  // Stable callback references
  const handleAddToCart = useCallback(() => {
    onAddToCart(product.id)
  }, [product.id, onAddToCart])

  return (
    <div className="product-card">
      <img src={product.image} alt={product.title} />
      <h3>{product.title}</h3>
      <div className="price">
        <span className="current">${product.price}</span>
        {discountPercentage > 0 && (
          <span className="discount">-{discountPercentage}%</span>
        )}
      </div>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  )
})

// Virtual scrolling for large lists
const VirtualizedProductList = ({ products }: { products: Product[] }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const visibleItems = useMemo(() => {
    // Calculate which items are visible based on scroll position
    // Only render visible items + buffer
    return products.slice(startIndex, endIndex)
  }, [products, startIndex, endIndex])

  return (
    <div ref={containerRef} className="virtualized-list">
      {visibleItems.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

---

## 🚀 **Next.js 15 App Router Mastery**

### **Advanced App Router Patterns**

```typescript
// app/g/[configId]/layout.tsx - Revolutionary nested layouts
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: { configId: string }
  children: React.ReactNode
}

// Dynamic metadata generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = await getConfig(params.configId)
  
  if (!config) {
    return { title: 'Store Not Found' }
  }

  return {
    title: config.storeName,
    description: config.description,
    openGraph: {
      title: config.storeName,
      description: config.description,
      images: [{ url: config.brandImage }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: config.storeName,
      description: config.description,
      images: [config.brandImage],
    },
    alternates: {
      canonical: `/${params.configId}`,
    },
  }
}

export default async function StoreLayout({ params, children }: Props) {
  const config = await getConfig(params.configId)
  
  if (!config) {
    notFound()
  }

  return (
    <div className="store-layout" data-theme={config.theme}>
      {/* Store-specific header */}
      <header className="store-header">
        <img src={config.logo} alt={config.storeName} />
        <h1>{config.storeName}</h1>
      </header>
      
      {/* Store content */}
      <main className="store-content">
        {children}
      </main>
      
      {/* Store-specific footer */}
      <footer className="store-footer">
        {config.socialLinks.map(link => (
          <a key={link.platform} href={link.url}>
            {link.platform}
          </a>
        ))}
      </footer>
    </div>
  )
}

// app/g/[configId]/page.tsx - Revolutionary server components
interface PageProps {
  params: { configId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function StorePage({ params, searchParams }: PageProps) {
  // Parallel data fetching
  const [config, products, analytics] = await Promise.all([
    getConfig(params.configId),
    getProducts(params.configId, {
      category: searchParams.category as string,
      sort: searchParams.sort as string,
    }),
    getAnalytics(params.configId) // Optional analytics data
  ])

  if (!config) {
    notFound()
  }

  return (
    <div className="store-page">
      {/* Hero section */}
      <section className="hero-section">
        <HeroContent config={config} />
      </section>
      
      {/* Products with streaming */}
      <section className="products-section">
        <Suspense fallback={<ProductsSkeleton />}>
          <ProductGrid 
            products={products}
            configId={params.configId}
          />
        </Suspense>
      </section>
      
      {/* Analytics (optional, loads separately) */}
      {analytics && (
        <Suspense fallback={null}>
          <AnalyticsInsights data={analytics} />
        </Suspense>
      )}
    </div>
  )
}

// app/g/[configId]/qv/[productId]/page.tsx - Modal routing
export default async function QuickViewModal({ 
  params 
}: { 
  params: { configId: string; productId: string } 
}) {
  const product = await getProduct(params.productId)
  
  if (!product) {
    notFound()
  }

  return (
    <Modal>
      <ProductQuickView 
        product={product} 
        configId={params.configId}
      />
    </Modal>
  )
}
```

### **Revolutionary API Routes**

```typescript
// app/api/stores/[configId]/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Edge runtime for global performance
export const runtime = 'edge'

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(['price-asc', 'price-desc', 'name', 'newest']).optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { configId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchSchema.parse(Object.fromEntries(searchParams))
    
    // Get products with caching
    const products = await getProducts(params.configId, query)
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=300',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// app/api/ai/recommendations/route.ts - AI integration
export async function POST(request: NextRequest) {
  const { userId, context, intent } = await request.json()
  
  try {
    const recommendations = await generateAIRecommendations({
      userId,
      context,
      intent,
    })
    
    return NextResponse.json({ recommendations })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
```

### **Middleware for Advanced Routing**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { geolocation } from '@vercel/edge'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { country, city } = geolocation(request)
  
  // Store localization
  if (pathname.startsWith('/g/')) {
    const response = NextResponse.next()
    
    // Add geo headers for personalization
    response.headers.set('x-user-country', country || 'US')
    response.headers.set('x-user-city', city || 'Unknown')
    
    // A/B testing
    const testVariant = Math.random() > 0.5 ? 'variant-a' : 'variant-b'
    response.headers.set('x-test-variant', testVariant)
    
    return response
  }
  
  // Admin panel authentication
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## 🏗️ **Alternative Frameworks**

### **Astro Islands Architecture**

```astro
---
// src/pages/g/[configId].astro
import Layout from '../../layouts/StoreLayout.astro'
import { ProductGrid } from '../../components/react/ProductGrid.tsx'
import { AnalyticsDashboard } from '../../components/vue/AnalyticsDashboard.vue'
import { ShoppingCart } from '../../components/svelte/ShoppingCart.svelte'

export async function getStaticPaths() {
  const configs = await getConfigs()
  return configs.map((config) => ({
    params: { configId: config.id },
    props: { config },
  }))
}

const { configId } = Astro.params
const { config } = Astro.props

const products = await getProducts(configId)
---

<Layout title={config.storeName}>
  <!-- Static content renders on server -->
  <section class="hero">
    <h1>{config.storeName}</h1>
    <p>{config.description}</p>
  </section>
  
  <!-- Interactive islands hydrated on demand -->
  <ProductGrid 
    client:visible 
    products={products}
    transition:name={`products-${configId}`}
  />
  
  <AnalyticsDashboard 
    client:media="(min-width: 768px)"
    configId={configId}
  />
  
  <ShoppingCart 
    client:idle
    configId={configId}
  />
</Layout>
```

### **Remix Centerstack Patterns**

```typescript
// app/routes/g.$configId.tsx
import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node"
import { useLoaderData, useActionData, Form, useFetcher } from "@remix-run/react"

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const searchQuery = url.searchParams.get("q")
  
  // Progressive enhancement - works with and without JS
  const [config, products] = await Promise.all([
    getConfig(params.configId!),
    getProducts(params.configId!, { search: searchQuery }),
  ])
  
  if (!config) {
    throw new Response("Store not found", { status: 404 })
  }
  
  return json({ config, products, searchQuery })
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData()
  const intent = formData.get("intent")
  
  switch (intent) {
    case "add-to-cart": {
      const productId = formData.get("productId") as string
      const result = await addToCart(productId)
      return json({ success: true, result })
    }
    case "search": {
      const query = formData.get("query") as string
      const products = await getProducts(params.configId!, { search: query })
      return json({ products })
    }
    default:
      return json({ error: "Unknown intent" }, { status: 400 })
  }
}

export default function StoreRoute() {
  const { config, products, searchQuery } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const fetcher = useFetcher()
  
  return (
    <div className="store">
      <h1>{config.storeName}</h1>
      
      {/* Progressive enhancement - works without JS */}
      <Form method="get" className="search-form">
        <input 
          name="q" 
          defaultValue={searchQuery || ""} 
          placeholder="Search products..."
        />
        <button type="submit">Search</button>
      </Form>
      
      {/* Enhanced with JS for better UX */}
      <fetcher.Form method="post" className="enhanced-search">
        <input type="hidden" name="intent" value="search" />
        <input 
          name="query" 
          onChange={(e) => {
            fetcher.submit(e.currentTarget.form)
          }}
          placeholder="Live search..."
        />
      </fetcher.Form>
      
      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.title} />
            <h3>{product.title}</h3>
            <p>${product.price}</p>
            
            <Form method="post">
              <input type="hidden" name="intent" value="add-to-cart" />
              <input type="hidden" name="productId" value={product.id} />
              <button type="submit" disabled={fetcher.state === "submitting"}>
                {fetcher.state === "submitting" ? "Adding..." : "Add to Cart"}
              </button>
            </Form>
          </div>
        ))}
      </div>
      
      {actionData?.success && (
        <div className="success-message">
          Product added to cart!
        </div>
      )}
    </div>
  )
}
```

---

## 📝 **TypeScript Elite Patterns**

### **Advanced Type Safety**

```typescript
// Revolutionary type definitions for MINIMALL
type StoreConfig = {
  id: string
  storeName: string
  slug: string
  theme: ThemeConfig
  layout: LayoutConfig
  integrations: IntegrationConfig
  analytics: AnalyticsConfig
}

type ThemeConfig = {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  borderRadius: 'sharp' | 'rounded' | 'pill'
  customCSS?: string
}

// Branded types for type safety
type ProductId = string & { readonly brand: unique symbol }
type UserId = string & { readonly brand: unique symbol }
type ConfigId = string & { readonly brand: unique symbol }

// Helper functions for branded types
const createProductId = (id: string): ProductId => id as ProductId
const createUserId = (id: string): UserId => id as UserId
const createConfigId = (id: string): ConfigId => id as ConfigId

// Advanced generic patterns
type APIResponse<T> = {
  data: T
  meta: {
    page: number
    limit: number
    total: number
    hasNextPage: boolean
  }
  success: true
} | {
  error: string
  code: string
  success: false
}

// Type-safe API client
class TypeSafeAPIClient {
  async get<T>(endpoint: string): Promise<APIResponse<T>> {
    const response = await fetch(`/api${endpoint}`)
    return response.json()
  }
  
  async post<TRequest, TResponse>(
    endpoint: string, 
    data: TRequest
  ): Promise<APIResponse<TResponse>> {
    const response = await fetch(`/api${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}

// Revolutionary discriminated unions for state management
type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: unknown }
  | { status: 'error'; error: string }

// Type guards
const isSuccess = (state: LoadingState): state is { status: 'success'; data: unknown } =>
  state.status === 'success'

const isError = (state: LoadingState): state is { status: 'error'; error: string } =>
  state.status === 'error'

// Usage
const handleState = (state: LoadingState) => {
  switch (state.status) {
    case 'idle':
      return <div>Ready to load</div>
    case 'loading':
      return <Spinner />
    case 'success':
      return <DataComponent data={state.data} /> // TypeScript knows data exists
    case 'error':
      return <ErrorMessage error={state.error} /> // TypeScript knows error exists
  }
}
```

### **Revolutionary Utility Types**

```typescript
// Advanced utility types for MINIMALL
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

type NonEmptyArray<T> = [T, ...T[]]

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type UnionToIntersection<U> = 
  (U extends any ? (x: U) => void : never) extends (x: infer I) => void ? I : never

// Example usage
type StoreConfigUpdate = DeepPartial<StoreConfig>
type RequiredProducts = NonEmptyArray<Product>
type CleanType = Prettify<StoreConfig & ThemeConfig>

// Revolutionary conditional types
type ApiEndpoint<T extends string> = 
  T extends `get${infer Resource}` 
    ? `/api/${Lowercase<Resource>}` 
    : `/api/${T}`

// Usage
type ProductEndpoint = ApiEndpoint<'getProducts'> // '/api/products'
type UserEndpoint = ApiEndpoint<'users'> // '/api/users'

// Template literal types for type-safe routing
type Routes = 
  | `/g/${string}`
  | `/g/${string}/products`
  | `/g/${string}/analytics`
  | '/admin'
  | '/admin/stores'

const navigate = (route: Routes) => {
  // TypeScript ensures only valid routes
  router.push(route)
}
```

---

*This foundation provides everything needed to build sophisticated, type-safe, and performant applications. Each pattern is production-tested and represents current best practices in the React/Next.js ecosystem.*