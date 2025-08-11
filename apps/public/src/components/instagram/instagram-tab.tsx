"use client";

import type { Category, SiteConfig } from "@minimall/core/client";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animationTokens } from "@/lib/animation-tokens";

interface InstagramTabProps {
  config: SiteConfig;
  onOpenPost: (postId: string, post: Category) => void;
  className?: string;
}

export function InstagramTab({ config, onOpenPost, className = "" }: InstagramTabProps) {
  const instagramCategory = useMemo(() => {
    const byTitle = config.categories.find((c) => c.title.toLowerCase() === "instagram");
    if (byTitle && byTitle.children && byTitle.children.length > 0) return byTitle;
    return config.categories.find((c) => c.children && c.children.length > 0) as Category;
  }, [config.categories]);

  if (!instagramCategory || !instagramCategory.children || instagramCategory.children.length === 0) {
    return <div className="text-center text-gray-400 py-12">No content available</div>;
  }

  return (
    <div className={className}>
      <InstagramGrid category={instagramCategory} onOpenPost={onOpenPost} />
    </div>
  );
}

function InstagramGrid({ category, onOpenPost }: { category: Category; onOpenPost: (postId: string, post: Category) => void }) {
  const items = category.children || [];
  const [visibleCount, setVisibleCount] = useState(Math.min(24, items.length));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !isLoadingMore && visibleCount < items.length) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((c) => Math.min(c + 12, items.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, visibleCount, items.length]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const videos = Array.from(root.querySelectorAll("video")) as HTMLVideoElement[];
    if (videos.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (!entry.isIntersecting) {
            try {
              v.pause();
            } catch {}
          }
        }
      },
      { threshold: 0.2 }
    );
    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [visibleCount]);

  return (
    <div ref={containerRef} className="grid grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-2 w-full max-w-sm md:max-w-2xl lg:max-w-4xl mx-auto">
      {items.slice(0, visibleCount).map((child, index) => {
        const [cardType, cardDetails] = child.card;
        const details = cardDetails as Record<string, any>;
        const isVideo = cardType === "video" || Boolean(details.videoUrl);
        return (
          <motion.div
            key={child.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: index * (animationTokens.duration.stagger / 1000),
              duration: animationTokens.duration.normal / 1000,
              ease: animationTokens.easing.entrance,
            }}
            whileHover={{
              scale: 1.02,
              transition: { duration: animationTokens.duration.fast / 1000, ease: animationTokens.easing.entrance },
            }}
            whileTap={{ scale: 0.98 }}
            className="relative aspect-square md:aspect-[4/5] lg:aspect-square"
          >
            <button type="button" onClick={() => onOpenPost(child.id, child)} className="w-full h-full relative overflow-hidden bg-gray-800 group">
              {isVideo ? (
                <video
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  poster={details.poster || details.image || details.imageUrl || undefined}
                  onMouseEnter={(e) => {
                    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                    try {
                      (e.currentTarget as HTMLVideoElement).play().catch(() => {});
                    } catch {}
                  }}
                  onMouseLeave={(e) => {
                    try {
                      (e.currentTarget as HTMLVideoElement).pause();
                    } catch {}
                  }}
                  onClick={(e) => {
                    const v = e.currentTarget as HTMLVideoElement;
                    try {
                      v.paused ? v.play() : v.pause();
                    } catch {}
                  }}
                >
                  {details.videoUrl && <source src={details.videoUrl} />}
                </video>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={details.image || details.imageUrl || ""} alt={child.title || "Content item"} className="w-full h-full object-cover" />
              )}
            </button>
          </motion.div>
        );
      })}
      {isLoadingMore &&
        Array.from({ length: Math.min(12, items.length - visibleCount) }).map((_, i) => (
          <div key={`skeleton-${i}`} className="relative aspect-square md:aspect-[4/5] lg:aspect-square">
            <div className="w-full h-full loading-shimmer rounded-sm" />
          </div>
        ))}
      <div ref={sentinelRef} className="col-span-full h-6" />
    </div>
  );
}


