"use client";

import type { SocialAnalytics, SocialPlatform, SocialPost } from "@minimall/core";
import { cn } from "@minimall/ui";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Eye,
  Hash,
  Heart,
  Instagram,
  MessageCircle,
  Music,
  Share,
  ShoppingCart,
  TrendingUp,
  Twitter,
  Users,
} from "lucide-react";

interface SocialMediaDashboardProps {
  posts: SocialPost[];
  analytics: SocialAnalytics[];
  className?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SocialMetrics {
  totalPosts: number;
  totalEngagement: number;
  totalReach: number;
  totalRevenue: number;
  avgEngagementRate: number;
  topPlatform: SocialPlatform;
  platformBreakdown: Record<
    SocialPlatform,
    {
      posts: number;
      engagement: number;
      revenue: number;
    }
  >;
}

export function SocialMediaDashboard({
  posts,
  analytics,
  className,
  dateRange,
}: SocialMediaDashboardProps) {
  // Calculate social media metrics
  const metrics = calculateSocialMetrics(posts, analytics);
  const topPosts = getTopPerformingPosts(posts, analytics);
  const trendingHashtags = getTrendingHashtags(posts);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Analytics</h2>
          <p className="text-gray-600">Track performance across all social platforms</p>
        </div>
        {dateRange && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Posts"
          value={metrics.totalPosts.toLocaleString()}
          icon={<Hash className="w-5 h-5" />}
          trend={+12}
          color="blue"
        />
        <MetricCard
          title="Total Engagement"
          value={formatLargeNumber(metrics.totalEngagement)}
          icon={<Heart className="w-5 h-5" />}
          trend={+8.3}
          color="red"
        />
        <MetricCard
          title="Total Reach"
          value={formatLargeNumber(metrics.totalReach)}
          icon={<Users className="w-5 h-5" />}
          trend={+15.7}
          color="green"
        />
        <MetricCard
          title="Revenue Generated"
          value={`$${(metrics.totalRevenue / 100).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          trend={+23.1}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Breakdown */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>
            <div className="space-y-4">
              {Object.entries(metrics.platformBreakdown).map(([platform, data]) => (
                <PlatformMetric
                  key={platform}
                  platform={platform as SocialPlatform}
                  posts={data.posts}
                  engagement={data.engagement}
                  revenue={data.revenue}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Trending Hashtags */}
        <div>
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Hashtags</h3>
            <div className="space-y-3">
              {trendingHashtags.slice(0, 10).map((hashtag, index) => (
                <div key={hashtag.tag} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm font-medium text-blue-600">#{hashtag.tag}</span>
                  </div>
                  <span className="text-xs text-gray-500">{hashtag.count} posts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Posts */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Posts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topPosts.map((post) => (
            <TopPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: number;
  color: "blue" | "red" | "green" | "yellow";
}

function MetricCard({ title, value, icon, trend, color }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    red: "bg-red-50 text-red-600 border-red-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
  };

  return (
    <motion.div
      className="bg-white rounded-xl border shadow-sm p-6"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg border", colorClasses[color])}>{icon}</div>
        {trend !== 0 && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              trend > 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
            )}
          >
            <TrendingUp className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </motion.div>
  );
}

interface PlatformMetricProps {
  platform: SocialPlatform;
  posts: number;
  engagement: number;
  revenue: number;
}

function PlatformMetric({ platform, posts, engagement, revenue }: PlatformMetricProps) {
  const platformConfig = {
    instagram: {
      name: "Instagram",
      icon: <Instagram className="w-5 h-5" />,
      color: "from-purple-500 to-pink-500",
    },
    tiktok: {
      name: "TikTok",
      icon: <Music className="w-5 h-5" />,
      color: "from-black to-red-500",
    },
    twitter: {
      name: "Twitter",
      icon: <Twitter className="w-5 h-5" />,
      color: "from-blue-400 to-blue-600",
    },
    manual: {
      name: "Manual Upload",
      icon: <Hash className="w-5 h-5" />,
      color: "from-gray-400 to-gray-600",
    },
  };

  const config = platformConfig[platform];
  if (!config) return null;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-gradient-to-r text-white", config.color)}>
          {config.icon}
        </div>
        <div>
          <p className="font-medium text-gray-900">{config.name}</p>
          <p className="text-sm text-gray-600">{posts} posts</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">{formatLargeNumber(engagement)}</p>
        <p className="text-sm text-gray-600">engagement</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-green-600">${(revenue / 100).toFixed(2)}</p>
        <p className="text-sm text-gray-600">revenue</p>
      </div>
    </div>
  );
}

interface TopPostCardProps {
  post: SocialPost;
}

function TopPostCard({ post }: TopPostCardProps) {
  const engagement = post.engagement.likes + post.engagement.comments + post.engagement.shares;

  return (
    <motion.div
      className="border rounded-lg overflow-hidden bg-white"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Media Preview */}
      <div className="aspect-square bg-gray-100 relative">
        {post.mediaUrls[0] && (
          <img src={post.mediaUrls[0]} alt={post.caption} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 left-2">
          <PlatformBadge platform={post.platform} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-900 line-clamp-2 mb-2">{post.caption || "No caption"}</p>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {formatLargeNumber(post.engagement.likes)}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {formatLargeNumber(post.engagement.comments)}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatLargeNumber(post.engagement.views)}
            </div>
          </div>
          <span>@{post.author.username}</span>
        </div>

        {/* Revenue */}
        {post.performance.revenue > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-green-600">
              <DollarSign className="w-3 h-3" />${(post.performance.revenue / 100).toFixed(2)}{" "}
              revenue
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PlatformBadge({ platform }: { platform: SocialPlatform }) {
  const config = {
    instagram: {
      icon: <Instagram className="w-3 h-3" />,
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
    },
    tiktok: { icon: <Music className="w-3 h-3" />, color: "bg-black" },
    twitter: { icon: <Twitter className="w-3 h-3" />, color: "bg-blue-500" },
    manual: { icon: <Hash className="w-3 h-3" />, color: "bg-gray-500" },
  };

  const platformConfig = config[platform];
  if (!platformConfig) return null;

  return (
    <div className={cn("p-1 rounded text-white text-xs", platformConfig.color)}>
      {platformConfig.icon}
    </div>
  );
}

// Helper functions
function calculateSocialMetrics(posts: SocialPost[], analytics: SocialAnalytics[]): SocialMetrics {
  const totalPosts = posts.length;
  const totalEngagement = posts.reduce(
    (sum, post) => sum + post.engagement.likes + post.engagement.comments + post.engagement.shares,
    0
  );
  const totalReach = analytics.reduce((sum, metric) => sum + metric.reach, 0);
  const totalRevenue = analytics.reduce((sum, metric) => sum + metric.revenue, 0);

  const platformBreakdown = posts.reduce(
    (acc, post) => {
      if (!acc[post.platform]) {
        acc[post.platform] = { posts: 0, engagement: 0, revenue: 0 };
      }
      acc[post.platform].posts++;
      acc[post.platform].engagement +=
        post.engagement.likes + post.engagement.comments + post.engagement.shares;
      acc[post.platform].revenue += post.performance.revenue;
      return acc;
    },
    {} as Record<SocialPlatform, { posts: number; engagement: number; revenue: number }>
  );

  const topPlatform =
    (Object.entries(platformBreakdown).sort(
      ([, a], [, b]) => b.engagement - a.engagement
    )[0]?.[0] as SocialPlatform) || "instagram";

  return {
    totalPosts,
    totalEngagement,
    totalReach,
    totalRevenue,
    avgEngagementRate: totalPosts > 0 ? totalEngagement / totalPosts : 0,
    topPlatform,
    platformBreakdown,
  };
}

function getTopPerformingPosts(posts: SocialPost[], analytics: SocialAnalytics[]): SocialPost[] {
  return posts
    .sort((a, b) => {
      const aEngagement = a.engagement.likes + a.engagement.comments + a.engagement.shares;
      const bEngagement = b.engagement.likes + b.engagement.comments + b.engagement.shares;
      return bEngagement - aEngagement;
    })
    .slice(0, 6);
}

function getTrendingHashtags(posts: SocialPost[]): { tag: string; count: number }[] {
  const hashtagCounts = new Map<string, number>();

  posts.forEach((post) => {
    post.hashtags.forEach((hashtag) => {
      hashtagCounts.set(hashtag, (hashtagCounts.get(hashtag) || 0) + 1);
    });
  });

  return Array.from(hashtagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
