# Implementation Examples - Ready-to-Use MINIMALL Patterns

This file contains copy-paste code patterns specifically designed for MINIMALL's link-in-bio platform. All examples are production-ready and follow best practices.

## 🛍️ **Core E-commerce Components**

### **Revolutionary Product Card**
Complete product card with animations, quick view, and cart integration.

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react'
import { useCartStore } from '@/stores/cart'
import { toast } from 'sonner'

interface Product {
  id: string
  title: string
  price: number
  image: string
  images: string[]
  description: string
  rating: number
  reviewCount: number
  isNew: boolean
  colors: string[]
  sizes: string[]
  inventory: number
}

export const ProductCard = ({ product }: { product: Product }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const [selectedSize, setSelectedSize] = useState(product.sizes[0])
  const addToCart = useCartStore(state => state.addItem)

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      color: selectedColor,
      size: selectedSize,
      quantity: 1
    })
    
    toast.success(`${product.title} added to cart!`, {
      description: `Color: ${selectedColor}, Size: ${selectedSize}`,
      action: {
        label: 'View Cart',
        onClick: () => router.push('/cart')
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {/* Product Image */}
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
          
          {/* Top Actions */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            {product.isNew && (
              <Badge className="bg-red-500 text-white border-0">NEW</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={`ml-auto rounded-full w-8 h-8 p-0 transition-all duration-300 ${
                isLiked ? 'bg-red-500 text-white' : 'bg-white/80 hover:bg-white'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setIsLiked(!isLiked)
              }}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
          
          {/* Quick Actions (shown on hover) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0, y: 20 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3 flex gap-2"
          >
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1 bg-white/90 hover:bg-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Quick View
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <QuickViewModal product={product} />
              </DialogContent>
            </Dialog>
            
            <Button 
              size="sm" 
              className="flex-1"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </motion.div>
        </div>
        
        <CardContent className="p-4">
          {/* Product Info */}
          <h3 className="font-semibold text-lg leading-tight mb-1 line-clamp-2">
            {product.title}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < product.rating 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              ({product.reviewCount})
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">${product.price}</span>
            {product.inventory < 5 && (
              <Badge variant="destructive" className="text-xs">
                Only {product.inventory} left
              </Badge>
            )}
          </div>
          
          {/* Color Options */}
          {product.colors.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm font-medium">Colors:</span>
              <div className="flex gap-1">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedColor === color 
                        ? 'border-gray-900' 
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.toLowerCase() }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
```

### **AI-Powered Product Recommendations**
Smart product recommendations using AI with smooth transitions.

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface AIRecommendation {
  id: string
  title: string
  reason: string
  confidence: number
  products: Product[]
}

export const AIProductRecommendations = ({ userId, currentProduct }: {
  userId?: string
  currentProduct?: Product
}) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            context: currentProduct ? {
              productId: currentProduct.id,
              category: currentProduct.category,
              price: currentProduct.price
            } : null,
            intent: 'product_discovery'
          })
        })
        
        const data = await response.json()
        setRecommendations(data.recommendations)
      } catch (error) {
        console.error('Failed to fetch AI recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [userId, currentProduct?.id])

  if (loading) {
    return <RecommendationsSkeleton />
  }

  return (
    <div className="space-y-6">
      {recommendations.map((rec, index) => (
        <motion.div
          key={rec.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <CardTitle className="text-lg">{rec.title}</CardTitle>
                <div className="ml-auto bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                  {Math.round(rec.confidence * 100)}% match
                </div>
              </div>
              <p className="text-sm text-gray-600">{rec.reason}</p>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {rec.products.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="font-medium text-sm line-clamp-2 mb-1">
                      {product.title}
                    </h4>
                    <p className="text-lg font-bold">${product.price}</p>
                  </motion.div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4 group">
                View All Recommendations
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

const RecommendationsSkeleton = () => (
  <div className="space-y-6">
    {[...Array(2)].map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="ml-auto h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j}>
                <Skeleton className="aspect-square rounded-lg mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)
```

### **Smart Shopping Cart with Optimization**
Advanced cart with AI-powered upsells and checkout optimization.

```typescript
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, Plus, Minus, Sparkles, Lock } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartStore } from '@/stores/cart'
import { formatCurrency } from '@/lib/utils'

export const SmartShoppingCart = () => {
  const { items, removeItem, updateQuantity, total, itemCount } = useCartStore()
  const [isOpen, setIsOpen] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState([])

  const handleQuantityChange = (id: string, change: number) => {
    const item = items.find(i => i.id === id)
    if (item) {
      const newQuantity = item.quantity + change
      if (newQuantity <= 0) {
        removeItem(id)
      } else {
        updateQuantity(id, newQuantity)
      }
    }
  }

  const fetchAISuggestions = async () => {
    if (items.length === 0) return
    
    try {
      const response = await fetch('/api/ai/cart-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items,
          total: total,
          intent: 'increase_aov' // Average Order Value
        })
      })
      
      const { suggestions } = await response.json()
      setAiSuggestions(suggestions)
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          onClick={() => {
            setIsOpen(true)
            fetchAISuggestions()
          }}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart
          {itemCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
              variant="destructive"
            >
              {itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart ({itemCount} items)
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 max-h-80 overflow-y-auto">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={`${item.id}-${item.color}-${item.size}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-3 p-3 border rounded-lg"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {item.title}
                        </h4>
                        
                        <div className="flex text-xs text-gray-500 gap-2 mt-1">
                          {item.color && <span>Color: {item.color}</span>}
                          {item.size && <span>Size: {item.size}</span>}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border rounded">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleQuantityChange(item.id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            
                            <span className="w-12 text-center text-sm">
                              {item.quantity}
                            </span>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleQuantityChange(item.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              onClick={() => removeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-pink-50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-sm">AI Recommendations</span>
                  </div>
                  
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{suggestion.title}</span>
                        <Button size="sm" variant="ghost" className="h-6 text-xs">
                          +{formatCurrency(suggestion.price)}
                        </Button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              <Separator />
              
              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
              
              {/* Checkout Button */}
              <Button className="w-full" size="lg">
                <Lock className="w-4 h-4 mr-2" />
                Secure Checkout
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Continue Shopping
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

## 📊 **Analytics & Performance Tracking**

### **Real-time Analytics Dashboard**
Live analytics with beautiful visualizations using Tremor.

```typescript
'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  Title,
  Text,
  Metric,
  AreaChart,
  BarChart,
  DonutChart,
  CategoryBar,
  BadgeDelta,
  Flex,
  Grid,
  Col,
  Tracker,
  ProgressBar
} from '@tremor/react'
import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react'

interface AnalyticsData {
  revenue: {
    total: number
    change: number
    daily: Array<{ date: string; revenue: number; target: number }>
  }
  orders: {
    total: number
    change: number
  }
  visitors: {
    total: number
    change: number
  }
  conversion: {
    rate: number
    change: number
  }
  topProducts: Array<{
    name: string
    sales: number
    revenue: number
  }>
  trafficSources: Array<{
    source: string
    visitors: number
    share: number
  }>
}

export const RealTimeAnalyticsDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    let eventSource: EventSource

    if (isLive) {
      // Set up Server-Sent Events for real-time updates
      eventSource = new EventSource('/api/analytics/stream')
      
      eventSource.onmessage = (event) => {
        const newData = JSON.parse(event.data)
        setData(prevData => ({
          ...prevData,
          ...newData
        }))
      }
      
      eventSource.onerror = () => {
        console.error('Analytics stream disconnected')
        setIsLive(false)
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [isLive])

  if (!data) {
    return <AnalyticsSkeleton />
  }

  const kpiData = [
    {
      title: "Total Revenue",
      metric: data.revenue.total,
      change: data.revenue.change,
      icon: DollarSign,
      color: "emerald"
    },
    {
      title: "Orders",
      metric: data.orders.total,
      change: data.orders.change,
      icon: ShoppingCart,
      color: "blue"
    },
    {
      title: "Visitors",
      metric: data.visitors.total,
      change: data.visitors.change,
      icon: Users,
      color: "violet"
    },
    {
      title: "Conversion Rate",
      metric: data.conversion.rate,
      change: data.conversion.change,
      icon: TrendingUp,
      color: "amber",
      suffix: "%"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title>Store Analytics</Title>
          <Text>Real-time performance metrics for your link-in-bio store</Text>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`} />
          <Text className="text-sm">
            {isLive ? 'Live' : 'Disconnected'}
          </Text>
        </div>
      </div>

      {/* KPI Cards */}
      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        {kpiData.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title}>
              <Flex alignItems="start">
                <div className="flex-1">
                  <Text>{item.title}</Text>
                  <Metric>
                    {typeof item.metric === 'number' && item.suffix !== '%'
                      ? `$${item.metric.toLocaleString()}`
                      : `${item.metric}${item.suffix || ''}`
                    }
                  </Metric>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className={`p-2 rounded-lg bg-${item.color}-100`}>
                    <Icon className={`w-4 h-4 text-${item.color}-600`} />
                  </div>
                  <BadgeDelta 
                    deltaType={item.change > 0 ? "increase" : "decrease"}
                  >
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </BadgeDelta>
                </div>
              </Flex>
              
              <CategoryBar
                values={[Math.abs(item.change)]}
                colors={[item.color]}
                className="mt-3"
              />
            </Card>
          )
        })}
      </Grid>

      {/* Charts Row */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        {/* Revenue Trend */}
        <Card>
          <Title>Revenue Trend (Last 30 Days)</Title>
          <AreaChart
            className="mt-4 h-80"
            data={data.revenue.daily}
            index="date"
            categories={["revenue", "target"]}
            colors={["emerald", "gray"]}
            valueFormatter={(number) => `$${number.toLocaleString()}`}
            showAnimation={true}
            animationDuration={1000}
            showGridLines={true}
            showYAxis={true}
            showTooltip={true}
          />
        </Card>
        
        {/* Top Products */}
        <Card>
          <Title>Top Products</Title>
          <BarChart
            className="mt-4 h-80"
            data={data.topProducts}
            index="name"
            categories={["sales"]}
            colors={["blue"]}
            valueFormatter={(number) => `${number} sales`}
            showAnimation={true}
            layout="vertical"
          />
        </Card>
      </Grid>

      {/* Traffic Sources & Performance Tracker */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6">
        <Card>
          <Title>Traffic Sources</Title>
          <DonutChart
            className="mt-4"
            data={data.trafficSources}
            category="visitors"
            index="source"
            colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
            showAnimation={true}
            showTooltip={true}
          />
        </Card>
        
        <Card>
          <Title>Daily Performance Tracker</Title>
          <Text>Goals achievement over the last 30 days</Text>
          <Tracker
            data={Array.from({ length: 30 }, (_, i) => ({
              color: Math.random() > 0.3 ? 'emerald' : Math.random() > 0.6 ? 'yellow' : 'rose',
              tooltip: `Day ${i + 1}: ${Math.random() > 0.5 ? 'Goal achieved' : 'Below target'}`
            }))}
            className="mt-2"
          />
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Revenue Goal Progress</span>
              <span>73%</span>
            </div>
            <ProgressBar value={73} color="emerald" />
            
            <div className="flex justify-between text-sm">
              <span>Order Goal Progress</span>
              <span>85%</span>
            </div>
            <ProgressBar value={85} color="blue" />
          </div>
        </Card>
      </Grid>
    </div>
  )
}

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="h-4 bg-gray-200 rounded w-96" />
    </div>
    
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-16" />
        </div>
      ))}
    </div>
    
    <div className="grid grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
          <div className="h-80 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  </div>
)
```

## 🎨 **Advanced Animations**

### **Page Transitions with Framer Motion**
Smooth page transitions for better user experience.

```typescript
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
}

export const PageTransition = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Stagger children animation
export const StaggerContainer = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

export const StaggerItem = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}
```

---

*These implementation examples are production-ready and specifically designed for MINIMALL's link-in-bio platform. Each pattern includes proper TypeScript typing, error handling, and accessibility features. Copy and customize as needed for your specific use case.*