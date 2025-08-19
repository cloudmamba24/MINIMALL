"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Instagram,
  Check,
  X,
  RefreshCw,
  Settings,
  Image as ImageIcon,
  Video,
  Grid,
  List,
  Calendar,
  Download,
  Upload,
  Link2,
  Unlink,
  AlertCircle,
  ChevronRight,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Eye,
  PlayCircle,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  Clock,
  TrendingUp,
  Users,
  Hash,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Key
} from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import type { Tile } from "@minimall/core/types/tiles";

interface InstagramIntegrationProps {
  onConnect?: (accessToken: string) => void;
  onDisconnect?: () => void;
  onImport?: (posts: InstagramPost[]) => Promise<void>;
}

interface InstagramAccount {
  id: string;
  username: string;
  profilePicture: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isBusinessAccount: boolean;
  connectedAt: Date;
  lastSyncedAt: Date;
  accessToken: string;
  expiresAt: Date;
}

interface InstagramPost {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  permalink: string;
  timestamp: Date;
  likeCount: number;
  commentCount: number;
  saveCount?: number;
  shareCount?: number;
  reachCount?: number;
  impressionCount?: number;
  engagementRate?: number;
  hashtags: string[];
  mentions: string[];
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  children?: InstagramPost[]; // For carousel posts
  insights?: {
    reach: number;
    impressions: number;
    engagement: number;
    saved: number;
    profileVisits: number;
    websiteClicks: number;
  };
}

interface ImportSettings {
  autoSync: boolean;
  syncInterval: "hourly" | "daily" | "weekly" | "manual";
  importCaptions: boolean;
  importHashtags: boolean;
  importLocation: boolean;
  importInsights: boolean;
  mediaTypes: {
    images: boolean;
    videos: boolean;
    reels: boolean;
    carousels: boolean;
  };
  dateRange: {
    enabled: boolean;
    startDate?: Date;
    endDate?: Date;
  };
  minEngagement: number;
}

export function InstagramIntegration({
  onConnect,
  onDisconnect,
  onImport
}: InstagramIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<InstagramAccount | null>(null);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS">("all");
  const [sortBy, setSortBy] = useState<"recent" | "likes" | "comments" | "engagement">("recent");
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    autoSync: false,
    syncInterval: "daily",
    importCaptions: true,
    importHashtags: true,
    importLocation: false,
    importInsights: true,
    mediaTypes: {
      images: true,
      videos: true,
      reels: true,
      carousels: true
    },
    dateRange: {
      enabled: false
    },
    minEngagement: 0
  });

  // Mock data for demonstration
  useEffect(() => {
    // Simulate fetching account data
    if (isConnected && !account) {
      setAccount({
        id: "ig_account_123",
        username: "minimall_shop",
        profilePicture: "https://via.placeholder.com/150",
        followersCount: 25430,
        followingCount: 892,
        postsCount: 456,
        isVerified: true,
        isBusinessAccount: true,
        connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastSyncedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        accessToken: "mock_token",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      // Generate mock posts
      const mockPosts: InstagramPost[] = Array.from({ length: 20 }, (_, i) => ({
        id: `post_${i}`,
        mediaType: ["IMAGE", "VIDEO", "CAROUSEL_ALBUM", "REELS"][Math.floor(Math.random() * 4)] as any,
        mediaUrl: `https://via.placeholder.com/400x400?text=Post+${i + 1}`,
        thumbnailUrl: `https://via.placeholder.com/150x150?text=Thumb+${i + 1}`,
        caption: `Amazing product showcase! Check out our latest collection 🛍️ #fashion #style #minimall`,
        permalink: `https://instagram.com/p/mock_${i}`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        likeCount: Math.floor(Math.random() * 5000),
        commentCount: Math.floor(Math.random() * 500),
        saveCount: Math.floor(Math.random() * 1000),
        shareCount: Math.floor(Math.random() * 200),
        reachCount: Math.floor(Math.random() * 10000),
        impressionCount: Math.floor(Math.random() * 15000),
        engagementRate: Math.random() * 10,
        hashtags: ["fashion", "style", "minimall", "shopping", "ootd"],
        mentions: ["@brandpartner", "@influencer"],
        location: i % 3 === 0 ? { name: "New York, NY" } : undefined,
        insights: {
          reach: Math.floor(Math.random() * 10000),
          impressions: Math.floor(Math.random() * 15000),
          engagement: Math.floor(Math.random() * 2000),
          saved: Math.floor(Math.random() * 500),
          profileVisits: Math.floor(Math.random() * 1000),
          websiteClicks: Math.floor(Math.random() * 200)
        }
      }));

      setPosts(mockPosts);
    }
  }, [isConnected, account]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post =>
        post.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by media type
    if (filterType !== "all") {
      filtered = filtered.filter(post => post.mediaType === filterType);
    }

    // Filter by import settings
    if (importSettings.dateRange.enabled) {
      const { startDate, endDate } = importSettings.dateRange;
      if (startDate) {
        filtered = filtered.filter(post => post.timestamp >= startDate);
      }
      if (endDate) {
        filtered = filtered.filter(post => post.timestamp <= endDate);
      }
    }

    if (importSettings.minEngagement > 0) {
      filtered = filtered.filter(post => 
        (post.engagementRate || 0) >= importSettings.minEngagement
      );
    }

    // Sort posts
    switch (sortBy) {
      case "likes":
        filtered = [...filtered].sort((a, b) => b.likeCount - a.likeCount);
        break;
      case "comments":
        filtered = [...filtered].sort((a, b) => b.commentCount - a.commentCount);
        break;
      case "engagement":
        filtered = [...filtered].sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0));
        break;
      case "recent":
      default:
        filtered = [...filtered].sort((a, b) => 
          b.timestamp.getTime() - a.timestamp.getTime()
        );
    }

    return filtered;
  }, [posts, searchQuery, filterType, sortBy, importSettings]);

  // Handle Instagram OAuth
  const handleConnect = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, this would open Instagram OAuth flow
      // For now, simulate connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsConnected(true);
      
      if (onConnect) {
        onConnect("mock_access_token");
      }
    } catch (error) {
      console.error("Failed to connect Instagram:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onConnect]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    if (confirm("Are you sure you want to disconnect your Instagram account?")) {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsConnected(false);
        setAccount(null);
        setPosts([]);
        setSelectedPosts(new Set());
        
        if (onDisconnect) {
          onDisconnect();
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [onDisconnect]);

  // Handle sync
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Simulate fetching new posts
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last synced time
      if (account) {
        setAccount({
          ...account,
          lastSyncedAt: new Date()
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [account]);

  // Handle import selected posts
  const handleImportSelected = useCallback(async () => {
    if (selectedPosts.size === 0) return;

    setIsLoading(true);
    try {
      const postsToImport = posts.filter(post => selectedPosts.has(post.id));
      
      if (onImport) {
        await onImport(postsToImport);
      }
      
      // Clear selection after import
      setSelectedPosts(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [selectedPosts, posts, onImport]);

  // Toggle post selection
  const togglePostSelection = useCallback((postId: string) => {
    setSelectedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  // Select all posts
  const selectAllPosts = useCallback(() => {
    setSelectedPosts(new Set(filteredPosts.map(p => p.id)));
  }, [filteredPosts]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedPosts(new Set());
  }, []);

  // Render connection screen
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8"
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Instagram className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connect Instagram
            </h2>
            <p className="text-gray-600 mb-8">
              Import your Instagram posts and manage them directly from MINIMALL
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Auto-sync posts</p>
                  <p className="text-sm text-gray-600">
                    Automatically import new Instagram posts
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Analytics & Insights</p>
                  <p className="text-sm text-gray-600">
                    Track performance across all your posts
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Shoppable Tags</p>
                  <p className="text-sm text-gray-600">
                    Add product tags to your Instagram posts
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Instagram className="w-5 h-5" />
                  Connect Instagram Account
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4">
              <Shield className="w-3 h-3 inline mr-1" />
              Your data is secure and encrypted
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render main interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              
              {account && (
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900">
                      @{account.username}
                    </h1>
                    {account.isVerified && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{account.followersCount.toLocaleString()} followers</span>
                    <span>{account.postsCount} posts</span>
                    <span>Last synced {new Date(account.lastSyncedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync"}
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 flex items-center gap-2"
              >
                <Unlink className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Auto Sync */}
                <div>
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      checked={importSettings.autoSync}
                      onChange={(e) => setImportSettings({
                        ...importSettings,
                        autoSync: e.target.checked
                      })}
                      className="rounded text-purple-600"
                    />
                    <span className="font-medium text-gray-900">Auto Sync</span>
                  </label>
                  
                  {importSettings.autoSync && (
                    <select
                      value={importSettings.syncInterval}
                      onChange={(e) => setImportSettings({
                        ...importSettings,
                        syncInterval: e.target.value as any
                      })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="hourly">Every hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="manual">Manual only</option>
                    </select>
                  )}
                </div>

                {/* Media Types */}
                <div>
                  <p className="font-medium text-gray-900 mb-3">Media Types</p>
                  <div className="space-y-2">
                    {Object.entries(importSettings.mediaTypes).map(([type, enabled]) => (
                      <label key={type} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => setImportSettings({
                            ...importSettings,
                            mediaTypes: {
                              ...importSettings.mediaTypes,
                              [type]: e.target.checked
                            }
                          })}
                          className="rounded text-purple-600"
                        />
                        <span className="text-sm text-gray-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Import Options */}
                <div>
                  <p className="font-medium text-gray-900 mb-3">Import Options</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importSettings.importCaptions}
                        onChange={(e) => setImportSettings({
                          ...importSettings,
                          importCaptions: e.target.checked
                        })}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm text-gray-700">Import captions</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importSettings.importHashtags}
                        onChange={(e) => setImportSettings({
                          ...importSettings,
                          importHashtags: e.target.checked
                        })}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm text-gray-700">Import hashtags</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={importSettings.importInsights}
                        onChange={(e) => setImportSettings({
                          ...importSettings,
                          importInsights: e.target.checked
                        })}
                        className="rounded text-purple-600"
                      />
                      <span className="text-sm text-gray-700">Import insights</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Filter by type */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="IMAGE">Images</option>
              <option value="VIDEO">Videos</option>
              <option value="CAROUSEL_ALBUM">Carousels</option>
              <option value="REELS">Reels</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="likes">Most Liked</option>
              <option value="comments">Most Commented</option>
              <option value="engagement">Highest Engagement</option>
            </select>

            {/* View mode */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${
                  viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${
                  viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedPosts.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedPosts.size} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Import Selected
                </button>
              </>
            )}
            
            {selectedPosts.size === 0 && filteredPosts.length > 0 && (
              <button
                onClick={selectAllPosts}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Select All ({filteredPosts.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Posts Grid/List */}
      <div className="p-6">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative group cursor-pointer ${
                  selectedPosts.has(post.id) ? "ring-2 ring-purple-500 ring-offset-2 rounded-lg" : ""
                }`}
                onClick={() => togglePostSelection(post.id)}
              >
                {/* Media */}
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={post.thumbnailUrl || post.mediaUrl}
                    alt={post.caption || "Instagram post"}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Media type indicator */}
                  <div className="absolute top-2 right-2">
                    {post.mediaType === "VIDEO" && (
                      <div className="bg-black/70 text-white p-1 rounded">
                        <Video className="w-4 h-4" />
                      </div>
                    )}
                    {post.mediaType === "CAROUSEL_ALBUM" && (
                      <div className="bg-black/70 text-white p-1 rounded">
                        <Grid className="w-4 h-4" />
                      </div>
                    )}
                    {post.mediaType === "REELS" && (
                      <div className="bg-black/70 text-white p-1 rounded">
                        <PlayCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Selection checkbox */}
                  <div className="absolute top-2 left-2">
                    <div className={`w-5 h-5 rounded border-2 ${
                      selectedPosts.has(post.id) 
                        ? "bg-purple-600 border-purple-600" 
                        : "bg-white/80 border-white"
                    } flex items-center justify-center`}>
                      {selectedPosts.has(post.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="flex items-center justify-center gap-4 mb-2">
                        <div className="flex items-center gap-1">
                          <Heart className="w-5 h-5" />
                          <span className="text-sm">{post.likeCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm">{post.commentCount}</span>
                        </div>
                      </div>
                      {post.engagementRate && (
                        <p className="text-xs">
                          {post.engagementRate.toFixed(1)}% engagement
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Post info */}
                <div className="mt-2">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {post.caption || "No caption"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(post.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts.size === filteredPosts.length && filteredPosts.length > 0}
                      onChange={() => {
                        if (selectedPosts.size === filteredPosts.length) {
                          clearSelection();
                        } else {
                          selectAllPosts();
                        }
                      }}
                      className="rounded text-purple-600"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Post
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Engagement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Insights
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => togglePostSelection(post.id)}
                        className="rounded text-purple-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.thumbnailUrl || post.mediaUrl}
                          alt=""
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {post.caption || "No caption"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {post.hashtags.slice(0, 3).map(tag => `#${tag}`).join(" ")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {post.mediaType === "IMAGE" && <ImageIcon className="w-3 h-3" />}
                        {post.mediaType === "VIDEO" && <Video className="w-3 h-3" />}
                        {post.mediaType === "CAROUSEL_ALBUM" && <Grid className="w-3 h-3" />}
                        {post.mediaType === "REELS" && <PlayCircle className="w-3 h-3" />}
                        {post.mediaType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Heart className="w-3.5 h-3.5" />
                          {post.likeCount}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {post.commentCount}
                        </span>
                      </div>
                      {post.engagementRate && (
                        <p className="text-xs text-gray-500 mt-1">
                          {post.engagementRate.toFixed(1)}% rate
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {post.insights && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">
                            Reach: {post.insights.reach.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">
                            Clicks: {post.insights.websiteClicks}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(post.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(post.permalink, "_blank");
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Instagram className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No posts found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or sync new posts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}