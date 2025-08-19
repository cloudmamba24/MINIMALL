"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Clock,
  Users,
  Package,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  Instagram,
  Hash,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  PlayCircle,
  Image as ImageIcon,
  Video,
  ShoppingBag,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { ShopifyProduct } from "@minimall/core/types";

interface EnhancedAnalyticsDashboardProps {
  configId?: string;
  products?: ShopifyProduct[];
}

interface RealtimeMetric {
  id: string;
  label: string;
  value: number;
  change: number;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ReactNode;
  color: string;
  sparklineData?: number[];
}

interface ConversionFunnel {
  stage: string;
  count: number;
  percentage: number;
  dropoff: number;
}

interface ProductPerformance {
  productId: string;
  productName: string;
  views: number;
  clicks: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
  imageUrl?: string;
}

interface InstagramMetric {
  postId: string;
  mediaType: "image" | "video" | "reel";
  impressions: number;
  reach: number;
  engagement: number;
  saves: number;
  shares: number;
  profileVisits: number;
  websiteClicks: number;
  storyExits?: number;
  storyReplies?: number;
}

interface HeatmapData {
  tileId: string;
  x: number;
  y: number;
  clicks: number;
  hoverTime: number;
}

export function EnhancedAnalyticsDashboard({
  configId,
  products = []
}: EnhancedAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d" | "90d">("24h");
  const [selectedMetric, setSelectedMetric] = useState<string>("overview");
  const [isRealtime, setIsRealtime] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [previousPeriodData, setPreviousPeriodData] = useState<any>(null);

  // Realtime metrics
  const realtimeMetrics: RealtimeMetric[] = useMemo(() => [
    {
      id: "active_users",
      label: "Active Users",
      value: data?.realtime?.activeUsers || 0,
      change: 12.5,
      changeType: "increase",
      icon: <Users className="w-4 h-4" />,
      color: "blue",
      sparklineData: [10, 15, 12, 18, 22, 20, 25]
    },
    {
      id: "page_views",
      label: "Page Views/min",
      value: data?.realtime?.pageViewsPerMinute || 0,
      change: -3.2,
      changeType: "decrease",
      icon: <Eye className="w-4 h-4" />,
      color: "purple",
      sparklineData: [30, 28, 32, 25, 22, 20, 18]
    },
    {
      id: "conversion_rate",
      label: "Conversion Rate",
      value: data?.realtime?.conversionRate || 0,
      change: 8.7,
      changeType: "increase",
      icon: <Target className="w-4 h-4" />,
      color: "green",
      sparklineData: [2.1, 2.3, 2.5, 2.4, 2.8, 3.0, 3.2]
    },
    {
      id: "avg_session",
      label: "Avg Session Time",
      value: data?.realtime?.avgSessionTime || 0,
      change: 0,
      changeType: "neutral",
      icon: <Clock className="w-4 h-4" />,
      color: "orange",
      sparklineData: [180, 195, 188, 201, 195, 198, 203]
    }
  ], [data]);

  // Conversion funnel data
  const conversionFunnel: ConversionFunnel[] = useMemo(() => [
    { stage: "Page Views", count: 10000, percentage: 100, dropoff: 0 },
    { stage: "Product Views", count: 6500, percentage: 65, dropoff: 35 },
    { stage: "Add to Cart", count: 2600, percentage: 26, dropoff: 60 },
    { stage: "Checkout Started", count: 1300, percentage: 13, dropoff: 50 },
    { stage: "Purchase Complete", count: 520, percentage: 5.2, dropoff: 60 }
  ], []);

  // Product performance data
  const productPerformance: ProductPerformance[] = useMemo(() => {
    if (!products.length) return [];
    
    return products.slice(0, 10).map(product => ({
      productId: product.id,
      productName: product.title,
      views: Math.floor(Math.random() * 5000),
      clicks: Math.floor(Math.random() * 1000),
      addToCart: Math.floor(Math.random() * 200),
      purchases: Math.floor(Math.random() * 50),
      revenue: Math.floor(Math.random() * 10000),
      conversionRate: Math.random() * 10,
      imageUrl: product.images[0]?.url
    }));
  }, [products]);

  // Instagram metrics
  const instagramMetrics: InstagramMetric[] = useMemo(() => [
    {
      postId: "post_1",
      mediaType: "image",
      impressions: 45230,
      reach: 38450,
      engagement: 5234,
      saves: 892,
      shares: 234,
      profileVisits: 1234,
      websiteClicks: 456
    },
    {
      postId: "post_2",
      mediaType: "reel",
      impressions: 125340,
      reach: 98234,
      engagement: 15678,
      saves: 2341,
      shares: 1234,
      profileVisits: 3456,
      websiteClicks: 890
    },
    {
      postId: "post_3",
      mediaType: "video",
      impressions: 67890,
      reach: 54321,
      engagement: 8901,
      saves: 1234,
      shares: 567,
      profileVisits: 2345,
      websiteClicks: 678
    }
  ], []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeframe: timeRange,
        ...(configId && { configId })
      });

      const response = await fetch(`/api/analytics/data?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, configId]);

  // Setup realtime updates
  useEffect(() => {
    if (isRealtime) {
      const interval = setInterval(fetchAnalytics, 5000); // Update every 5 seconds
      setRefreshInterval(interval as any);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [isRealtime, fetchAnalytics, refreshInterval]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Render metric card
  const renderMetricCard = (metric: RealtimeMetric) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
      green: "bg-green-50 text-green-600 border-green-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200"
    };

    return (
      <motion.div
        key={metric.id}
        className="bg-white rounded-xl border shadow-sm p-6"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg border ${colorClasses[metric.color as keyof typeof colorClasses]}`}>
            {metric.icon}
          </div>
          {metric.changeType !== "neutral" && (
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              metric.changeType === "increase" 
                ? "bg-green-50 text-green-600" 
                : "bg-red-50 text-red-600"
            }`}>
              {metric.changeType === "increase" ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(metric.change)}%
            </div>
          )}
        </div>

        <div>
          <p className="text-2xl font-bold text-gray-900">
            {metric.label === "Avg Session Time" 
              ? `${Math.floor(metric.value / 60)}:${(metric.value % 60).toString().padStart(2, '0')}`
              : metric.label === "Conversion Rate"
              ? `${metric.value.toFixed(1)}%`
              : metric.value.toLocaleString()
            }
          </p>
          <p className="text-sm text-gray-600 mt-1">{metric.label}</p>
        </div>

        {/* Mini sparkline */}
        {metric.sparklineData && (
          <div className="mt-4 h-8">
            <svg className="w-full h-full" viewBox="0 0 100 32">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300"
                points={metric.sparklineData
                  .map((val, i) => `${(i / (metric.sparklineData!.length - 1)) * 100},${32 - (val / Math.max(...metric.sparklineData!) * 32)}`)
                  .join(" ")}
              />
            </svg>
          </div>
        )}
      </motion.div>
    );
  };

  // Render conversion funnel
  const renderConversionFunnel = () => (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
        <button className="text-sm text-gray-500 hover:text-gray-700">
          View Details →
        </button>
      </div>

      <div className="space-y-4">
        {conversionFunnel.map((stage, index) => (
          <div key={stage.stage}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-900 font-medium">
                  {stage.count.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">
                  {stage.percentage}%
                </span>
                {stage.dropoff > 0 && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3" />
                    {stage.dropoff}%
                  </span>
                )}
              </div>
            </div>
            
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg"
                initial={{ width: 0 }}
                animate={{ width: `${stage.percentage}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overall Conversion Rate</p>
            <p className="text-2xl font-bold text-gray-900">5.2%</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="text-2xl font-bold text-green-600">$45,230</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render product performance table
  const renderProductPerformance = () => (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            <button className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Add to Cart
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Purchases
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Conv. Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {productPerformance.map((product) => (
              <tr key={product.productId} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {product.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {product.productId.slice(-8)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {product.views.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {product.clicks.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {product.addToCart}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {product.purchases}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">
                  ${product.revenue.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900">
                      {product.conversionRate.toFixed(1)}%
                    </span>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{ width: `${product.conversionRate * 10}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Instagram insights
  const renderInstagramInsights = () => (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Instagram className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Instagram Insights</h3>
        </div>
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          Connect Instagram →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {instagramMetrics.map((metric) => (
          <div key={metric.postId} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {metric.mediaType === "image" && <ImageIcon className="w-4 h-4 text-gray-500" />}
                {metric.mediaType === "video" && <Video className="w-4 h-4 text-gray-500" />}
                {metric.mediaType === "reel" && <PlayCircle className="w-4 h-4 text-gray-500" />}
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {metric.mediaType}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {metric.postId}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Impressions</span>
                <span className="text-sm font-medium text-gray-900">
                  {metric.impressions.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Reach</span>
                <span className="text-sm font-medium text-gray-900">
                  {metric.reach.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Engagement</span>
                <span className="text-sm font-medium text-gray-900">
                  {metric.engagement.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-around text-xs">
                <div className="flex items-center gap-1 text-gray-600">
                  <Heart className="w-3 h-3" />
                  {Math.floor(metric.engagement * 0.7)}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MessageCircle className="w-3 h-3" />
                  {Math.floor(metric.engagement * 0.2)}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Share2 className="w-3 h-3" />
                  {metric.shares}
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Bookmark className="w-3 h-3" />
                  {metric.saves}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Website Clicks</span>
                <span className="text-sm font-medium text-purple-600">
                  {metric.websiteClicks}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instagram Story Performance */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Story Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">85%</p>
            <p className="text-xs text-gray-600">Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">2.3s</p>
            <p className="text-xs text-gray-600">Avg View Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">234</p>
            <p className="text-xs text-gray-600">Story Replies</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">12%</p>
            <p className="text-xs text-gray-600">Exit Rate</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render performance alerts
  const renderPerformanceAlerts = () => (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Alerts</h3>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Page Load Speed Improved
            </p>
            <p className="text-xs text-green-700 mt-1">
              Average load time decreased by 23% in the last 24 hours
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              High Bounce Rate Detected
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Homepage bounce rate is 15% higher than average
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">
              Checkout Errors Increasing
            </p>
            <p className="text-xs text-red-700 mt-1">
              3 failed checkout attempts in the last hour
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              New Traffic Source Detected
            </p>
            <p className="text-xs text-blue-700 mt-1">
              25% increase in traffic from TikTok referrals
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track performance and insights across all channels
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Realtime toggle */}
              <button
                onClick={() => setIsRealtime(!isRealtime)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  isRealtime 
                    ? "bg-green-100 text-green-700 border border-green-300" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Activity className={`w-4 h-4 ${isRealtime ? "animate-pulse" : ""}`} />
                {isRealtime ? "Live" : "Realtime"}
              </button>

              {/* Compare toggle */}
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  compareMode 
                    ? "bg-purple-100 text-purple-700 border border-purple-300" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Compare
              </button>

              {/* Time range selector */}
              <div className="relative">
                <button className="px-4 py-2 bg-white border rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {timeRange === "1h" && "Last Hour"}
                  {timeRange === "24h" && "Last 24 Hours"}
                  {timeRange === "7d" && "Last 7 Days"}
                  {timeRange === "30d" && "Last 30 Days"}
                  {timeRange === "90d" && "Last 90 Days"}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-1 mt-4 -mb-px">
            {[
              { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
              { id: "products", label: "Products", icon: <Package className="w-4 h-4" /> },
              { id: "instagram", label: "Instagram", icon: <Instagram className="w-4 h-4" /> },
              { id: "conversion", label: "Conversion", icon: <Target className="w-4 h-4" /> },
              { id: "performance", label: "Performance", icon: <Zap className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMetric(tab.id)}
                className={`px-4 py-2 font-medium text-sm rounded-t-lg flex items-center gap-2 transition-colors ${
                  selectedMetric === tab.id
                    ? "bg-gray-50 text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {selectedMetric === "overview" && (
          <div className="space-y-6">
            {/* Realtime metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {realtimeMetrics.map(renderMetricCard)}
            </div>

            {/* Charts and funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderConversionFunnel()}
              {renderPerformanceAlerts()}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {selectedMetric === "products" && (
          <div className="space-y-6">
            {renderProductPerformance()}
          </div>
        )}

        {/* Instagram Tab */}
        {selectedMetric === "instagram" && (
          <div className="space-y-6">
            {renderInstagramInsights()}
          </div>
        )}

        {/* Conversion Tab */}
        {selectedMetric === "conversion" && (
          <div className="space-y-6">
            {renderConversionFunnel()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderProductPerformance()}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {selectedMetric === "performance" && (
          <div className="space-y-6">
            {renderPerformanceAlerts()}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {realtimeMetrics.map(renderMetricCard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}