"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Home,
  Grid3x3,
  TrendingUp,
  Instagram,
  Settings,
  Plus,
  Play,
  Heart,
  MessageCircle,
  Bookmark,
  ShoppingBag,
  Sparkles,
  Zap,
  Camera,
  Video,
  DollarSign,
  Users,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  Package,
  Tag,
  Palette,
  Link2,
  Share2,
  Download,
  Upload,
  RefreshCw,
  Target,
  Flame
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface QuickStat {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}

interface RecentPost {
  id: string;
  image: string;
  likes: number;
  comments: number;
  saves: number;
  revenue: number;
  products: number;
  timestamp: string;
}

export default function ModernAdminDashboard() {
  const router = useRouter();
  const [greeting, setGreeting] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month">("week");
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const quickStats: QuickStat[] = [
    {
      label: "Total Revenue",
      value: "$12,847",
      change: 23.5,
      icon: <DollarSign className="w-5 h-5" />,
      color: "from-green-500 to-emerald-600"
    },
    {
      label: "Profile Views",
      value: "48.2K",
      change: 18.2,
      icon: <Eye className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600"
    },
    {
      label: "Engagement Rate",
      value: "8.7%",
      change: -2.1,
      icon: <Heart className="w-5 h-5" />,
      color: "from-pink-500 to-red-500"
    },
    {
      label: "Active Products",
      value: "142",
      change: 5,
      icon: <Package className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-600"
    }
  ];

  const recentPosts: RecentPost[] = [
    {
      id: "1",
      image: "https://source.unsplash.com/400x400/?fashion,product",
      likes: 3421,
      comments: 234,
      saves: 567,
      revenue: 2340,
      products: 3,
      timestamp: "2 hours ago"
    },
    {
      id: "2",
      image: "https://source.unsplash.com/400x400/?beauty,cosmetics",
      likes: 5632,
      comments: 423,
      saves: 892,
      revenue: 4567,
      products: 5,
      timestamp: "5 hours ago"
    },
    {
      id: "3",
      image: "https://source.unsplash.com/400x400/?jewelry,accessories",
      likes: 2187,
      comments: 156,
      saves: 234,
      revenue: 1234,
      products: 2,
      timestamp: "1 day ago"
    },
    {
      id: "4",
      image: "https://source.unsplash.com/400x400/?shoes,sneakers",
      likes: 8934,
      comments: 672,
      saves: 1234,
      revenue: 6789,
      products: 4,
      timestamp: "2 days ago"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Modern Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    MINIMALL
                  </h1>
                  <p className="text-xs text-gray-500">Creator Studio</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts, products, analytics..."
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Actions */}
              <button
                onClick={() => router.push("/editor/new")}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Create</span>
              </button>

              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
              </button>

              {/* Profile */}
              <button className="flex items-center gap-3 hover:bg-white/5 rounded-full p-1 pr-3 transition-colors">
                <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full" />
                <span className="text-sm hidden md:block">@creator</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 flex items-center gap-6 border-t border-white/5">
          <button className="py-3 border-b-2 border-purple-500 text-purple-400">
            <span className="text-sm font-medium">Overview</span>
          </button>
          <button 
            onClick={() => router.push("/editor")}
            className="py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">Content</span>
          </button>
          <button 
            onClick={() => router.push("/analytics")}
            className="py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">Analytics</span>
          </button>
          <button 
            onClick={() => router.push("/instagram")}
            className="py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">Instagram</span>
          </button>
          <button 
            onClick={() => router.push("/settings")}
            className="py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {greeting}, Creator ✨
          </h2>
          <p className="text-gray-400">Here's how your content is performing today</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl -z-10 className={stat.color}" />
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${
                    stat.change > 0 ? "text-green-400" : "text-red-400"
                  }`}>
                    {stat.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{Math.abs(stat.change)}%</span>
                  </div>
                </div>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Posts Performance */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Posts Performance</h3>
              <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                View all →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="group cursor-pointer">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                    <Image
                      src={post.image}
                      alt="Post"
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" fill="currentColor" />
                            {post.likes > 1000 ? `${(post.likes / 1000).toFixed(1)}k` : post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" />
                            ${post.revenue}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{post.products} products</span>
                      <span>{post.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3 h-3" />
                        {post.saves}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Insights */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/editor/new")}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Grid3x3 className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm">Create New Grid</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => router.push("/instagram")}
                  className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Instagram className="w-4 h-4 text-pink-400" />
                    </div>
                    <span className="text-sm">Import from Instagram</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Tag className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-sm">Tag Products</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Trending Now */}
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-semibold">Trending Now</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Summer Collection</span>
                  <span className="text-xs text-purple-400">+234% 🔥</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Minimalist Jewelry</span>
                  <span className="text-xs text-purple-400">+189%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Sustainable Fashion</span>
                  <span className="text-xs text-purple-400">+156%</span>
                </div>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold">Pro Tip</h3>
              </div>
              <p className="text-sm text-gray-300 mb-3">
                Posts with 3-5 product tags get 47% more engagement than those with just one.
              </p>
              <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                Learn more →
              </button>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="mt-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Performance Overview</h3>
            <div className="flex items-center gap-2">
              {["day", "week", "month"].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period as any)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    selectedPeriod === period
                      ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Placeholder for actual chart */}
          <div className="h-64 flex items-center justify-center border border-white/10 rounded-xl">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Performance chart will be rendered here</p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => router.push("/editor/new")}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50 z-50"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}