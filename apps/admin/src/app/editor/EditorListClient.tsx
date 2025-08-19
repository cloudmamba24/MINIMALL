"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { 
  Plus, 
  ExternalLink, 
  Calendar, 
  Globe, 
  Sparkles,
  Grid3x3,
  ArrowRight,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

interface ConfigListItem {
  id: string;
  shop?: string | null;
  slug?: string | null;
  updatedAt?: string | Date | null;
}

export default function EditorListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ConfigListItem[]>([]);

  const suffix = useMemo(() => {
    const host = searchParams.get("host");
    const shop = searchParams.get("shop");
    const qs = new URLSearchParams();
    if (host) qs.set("host", host);
    if (shop) qs.set("shop", shop);
    const str = qs.toString();
    return str ? `?${str}` : "";
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/configs");
        const json = await res.json();
        setItems(json.items || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Your Pages
              </h1>
              <p className="text-gray-400">Manage your Instagram-linked shopping experiences</p>
            </div>
            <button
              onClick={() => router.push(`/editor/new${suffix}`)}
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
              <p className="text-gray-400">Loading your pages...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-tr from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Grid3x3 className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No pages yet</h2>
              <p className="text-gray-400 mb-6">Create your first Instagram shopping page</p>
              <button
                onClick={() => router.push(`/editor/new${suffix}`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:shadow-lg hover:shadow-purple-500/25 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Get Started</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {/* Gradient accent */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2 truncate">{item.id}</h3>
                    
                    <div className="space-y-2 text-sm">
                      {item.shop && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <Globe className="w-4 h-4" />
                          <span className="truncate">{item.shop}</span>
                        </div>
                      )}
                      
                      {item.slug && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <ExternalLink className="w-4 h-4" />
                          <span className="truncate">{item.slug}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {(() => {
                            const dateValue =
                              typeof item.updatedAt === "string"
                                ? new Date(item.updatedAt)
                                : (item.updatedAt ?? null);
                            if (!dateValue) return "Never updated";
                            
                            const now = new Date();
                            const diff = now.getTime() - dateValue.getTime();
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const days = Math.floor(hours / 24);
                            
                            if (hours < 1) return "Just now";
                            if (hours < 24) return `${hours}h ago`;
                            if (days < 30) return `${days}d ago`;
                            return dateValue.toLocaleDateString();
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push(`/editor/${item.id}${suffix}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all group/btn"
                  >
                    <span className="text-sm font-medium">Open Editor</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Section */}
        {!loading && items.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-sm text-gray-400">Total Pages</p>
                </div>
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Grid3x3 className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {items.filter(item => {
                      const dateValue = typeof item.updatedAt === "string"
                        ? new Date(item.updatedAt)
                        : (item.updatedAt ?? null);
                      if (!dateValue) return false;
                      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                      return dateValue > dayAgo;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-400">Updated Today</p>
                </div>
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {items.filter(item => item.shop).length}
                  </p>
                  <p className="text-sm text-gray-400">With Shop</p>
                </div>
                <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-pink-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}