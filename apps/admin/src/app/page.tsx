"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { 
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Instagram,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Grid3x3,
  Zap,
  Activity,
  DollarSign,
  BarChart3,
  Package,
  ChevronRight,
  Play,
  Palette,
  Camera,
  Video,
  Music,
  Share2,
  Bell,
  Search,
  Menu,
  X,
  Globe,
  Target,
  Flame,
  Star,
  Award,
  Crown,
  Gem
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Tilt from "react-parallax-tilt";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

// Particle Background Component
function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2
      });
    }

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        ctx.fillStyle = `rgba(168, 85, 247, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 opacity-50"
      style={{ pointerEvents: 'none' }}
    />
  );
}

// 3D Card Component
function Card3D({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <Tilt
      className={cn("transform-gpu", className)}
      tiltMaxAngleX={10}
      tiltMaxAngleY={10}
      perspective={1000}
      transitionSpeed={2000}
      scale={1.05}
      gyroscope={true}
    >
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 transition-all duration-300">
          {children}
        </div>
      </div>
    </Tilt>
  );
}

// Animated Counter Component
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  useEffect(() => {
    if (inView) {
      const timer = setInterval(() => {
        setCount(prev => {
          const increment = Math.ceil(value / 50);
          if (prev + increment >= value) {
            clearInterval(timer);
            return value;
          }
          return prev + increment;
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [inView, value]);

  return (
    <span ref={ref} className="font-bold text-3xl">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Instagram Grid Preview
function InstagramGrid() {
  const posts = [
    { id: 1, type: 'image', likes: 5432, comments: 234, gradient: 'from-purple-500 to-pink-500' },
    { id: 2, type: 'video', likes: 8765, comments: 432, gradient: 'from-blue-500 to-cyan-500' },
    { id: 3, type: 'reel', likes: 12345, comments: 678, gradient: 'from-green-500 to-emerald-500' },
    { id: 4, type: 'image', likes: 3456, comments: 123, gradient: 'from-orange-500 to-red-500' },
    { id: 5, type: 'video', likes: 9876, comments: 456, gradient: 'from-indigo-500 to-purple-500' },
    { id: 6, type: 'image', likes: 6789, comments: 234, gradient: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {posts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.05, zIndex: 10 }}
          className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient}`} />
          
          {/* Content Type Icon */}
          <div className="absolute top-2 right-2 z-10">
            {post.type === 'video' && <Video className="w-5 h-5 text-white drop-shadow-lg" />}
            {post.type === 'reel' && <Play className="w-5 h-5 text-white drop-shadow-lg" />}
            {post.type === 'image' && <Camera className="w-5 h-5 text-white drop-shadow-lg" />}
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="flex items-center gap-4 justify-center">
                <div className="flex items-center gap-1">
                  <Heart className="w-5 h-5" fill="white" />
                  <span className="text-sm font-bold">{post.likes.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-5 h-5" fill="white" />
                  <span className="text-sm font-bold">{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Main Dashboard Component
export default function ModernDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const stats = [
    { 
      label: "Total Revenue", 
      value: 128470, 
      change: 23.5, 
      icon: <DollarSign className="w-6 h-6" />,
      prefix: "$",
      gradient: "from-emerald-400 to-green-600"
    },
    { 
      label: "Profile Views", 
      value: 482000, 
      change: 18.2, 
      icon: <Eye className="w-6 h-6" />,
      suffix: "",
      gradient: "from-purple-400 to-pink-600"
    },
    { 
      label: "Engagement Rate", 
      value: 8.7, 
      change: -2.1, 
      icon: <Heart className="w-6 h-6" />,
      suffix: "%",
      gradient: "from-pink-400 to-red-600"
    },
    { 
      label: "Active Products", 
      value: 142, 
      change: 5, 
      icon: <Package className="w-6 h-6" />,
      gradient: "from-blue-400 to-cyan-600"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <ParticleBackground />
      
      {/* Gradient Orbs */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl animate-aurora" />
      </div>

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Header */}
      <header className="relative z-40 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-lg opacity-50" />
                  <div className="relative w-12 h-12 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
                    MINIMALL
                  </h1>
                  <p className="text-xs text-gray-400">Creator Studio Pro</p>
                </div>
              </motion.div>

              {/* Search Bar */}
              <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:border-purple-500/50 transition-all duration-300 w-96">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
                />
                <kbd className="px-2 py-0.5 text-xs bg-white/10 rounded">⌘K</kbd>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/editor/new')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-medium hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300"
              >
                <Plus className="w-5 h-5" />
                <span>Create</span>
              </motion.button>

              <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-full" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">Creator Pro</p>
                  <p className="text-xs text-gray-400">Level 42</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {['Overview', 'Content', 'Analytics', 'Products', 'Instagram'].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-all duration-300 relative",
                activeTab === tab.toLowerCase() 
                  ? "text-white" 
                  : "text-gray-400 hover:text-white"
              )}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600 to-pink-600"
                />
              )}
            </motion.button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Welcome Section with Animated Text */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
              Welcome back, Creator
            </span>{" "}
            <motion.span
              animate={{ rotate: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="inline-block"
            >
              ✨
            </motion.span>
          </h2>
          <p className="text-gray-400 text-lg">Your empire is growing. Here's what's happening today.</p>
        </motion.div>

        {/* Stats Grid with 3D Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card3D>
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.gradient} shadow-lg`}>
                    {stat.icon}
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-bold",
                    stat.change > 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {stat.change > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <AnimatedCounter 
                  value={stat.value} 
                  prefix={stat.prefix} 
                  suffix={stat.suffix}
                />
                <p className="text-gray-400 mt-2">{stat.label}</p>
              </Card3D>
            </motion.div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Instagram Grid Preview */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card3D className="h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Instagram className="w-5 h-5" />
                  Recent Posts Performance
                </h3>
                <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  View all →
                </button>
              </div>
              <InstagramGrid />
            </Card3D>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Trending Section */}
            <Card3D>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-400" />
                <h3 className="text-lg font-bold">Trending Now</h3>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Summer Collection", growth: "+234%", hot: true },
                  { name: "Minimalist Jewelry", growth: "+189%" },
                  { name: "Sustainable Fashion", growth: "+156%" }
                ].map((trend) => (
                  <div key={trend.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="text-sm">{trend.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-400 font-bold">{trend.growth}</span>
                      {trend.hot && <span className="text-xs">🔥</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card3D>

            {/* Quick Actions */}
            <Card3D>
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { icon: <Grid3x3 className="w-4 h-4" />, label: "Create Grid", color: "from-purple-600 to-pink-600" },
                  { icon: <Instagram className="w-4 h-4" />, label: "Import Posts", color: "from-blue-600 to-cyan-600" },
                  { icon: <Sparkles className="w-4 h-4" />, label: "AI Generate", color: "from-green-600 to-emerald-600" }
                ].map((action) => (
                  <motion.button
                    key={action.label}
                    whileHover={{ x: 5 }}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-gradient-to-r ${action.color} rounded-lg`}>
                        {action.icon}
                      </div>
                      <span className="text-sm">{action.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                  </motion.button>
                ))}
              </div>
            </Card3D>
          </motion.div>
        </div>
      </main>
    </div>
  );
}