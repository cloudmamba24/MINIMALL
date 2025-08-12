"use client";

import type { Category, LayoutConfig } from "@minimall/core";
import { type PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { safeArrayAccess } from "../../lib/type-utils";
import { cn } from "../../lib/utils";

interface StoriesRendererProps {
  category: Category;
  layout: LayoutConfig;
  onTileClick?: (category: Category, index: number) => void;
  className?: string;
}

export function StoriesRenderer({
  category,
  layout,
  onTileClick,
  className,
}: StoriesRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const y = useMotionValue(0);

  // Story duration (5 seconds per story)
  const STORY_DURATION = 5000;

  // Filter items based on media type
  const getFilteredItems = () => {
    if (!category.children) return [];

    return category.children.filter((item) => {
      if (layout.mediaFilter === "all") return true;

      const cardDetails = item.card[1];
      if (layout.mediaFilter === "photo") {
        return cardDetails.image || cardDetails.imageUrl;
      }
      if (layout.mediaFilter === "video") {
        return cardDetails.videoUrl;
      }
      return true;
    });
  };

  const filteredItems = getFilteredItems();
  const totalItems = filteredItems.length;

  // Auto-advance stories
  useEffect(() => {
    if (!isPlaying) return;

    const startTime = Date.now();
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(progressPercent);

      if (elapsed >= STORY_DURATION) {
        goToNext();
      } else {
        timeoutRef.current = setTimeout(updateProgress, 50);
      }
    };

    timeoutRef.current = setTimeout(updateProgress, 50);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, isPlaying]);

  // Navigation
  const goToNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      // Loop back to first story
      setCurrentIndex(0);
      setProgress(0);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const _goToStory = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(index, totalItems - 1)));
    setProgress(0);
  };

  // Handle vertical drag
  const handleDragEnd = (_event: any, info: PanInfo) => {
    setIsDragging(false);

    const threshold = 100;
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (Math.abs(velocity) > 500 || Math.abs(offset) > threshold) {
      if (offset < 0 && velocity <= 0) {
        goToNext();
      } else if (offset > 0 && velocity >= 0) {
        goToPrevious();
      }
    }

    // Reset position
    y.set(0);
  };

  // Handle tap interactions
  const handleTap = (event: any) => {
    if (isDragging) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = event.clientX - rect.left;
    const centerX = rect.width / 2;

    if (clickX < centerX) {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  const togglePlayPause = (event: any) => {
    event.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (event: any) => {
    event.stopPropagation();
    setIsMuted(!isMuted);
  };

  const handleStoryClick = (item: Category, index: number) => {
    if (onTileClick && !isDragging) {
      onTileClick(item, index);
    }
  };

  if (filteredItems.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-full text-gray-500", className)}>
        No stories available
      </div>
    );
  }

  const currentItem = safeArrayAccess(filteredItems, currentIndex);
  if (!currentItem) {
    return (
      <div className={cn("flex items-center justify-center h-full text-gray-500", className)}>
        Story not found
      </div>
    );
  }
  const cardDetails = currentItem.card[1];

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden bg-black", className)}
      style={{
        borderRadius: `${layout.borderRadius}px`,
        aspectRatio: layout.aspect === "auto" ? "9/16" : layout.aspect,
      }}
    >
      {/* Progress bars */}
      <div className="absolute top-2 left-2 right-2 z-30 flex space-x-1">
        {filteredItems.map((_, index) => (
          <div key={index} className="flex-1 bg-white/30 rounded-full h-1">
            <div
              className="bg-white rounded-full h-1 transition-all duration-100"
              style={{
                width:
                  index === currentIndex ? `${progress}%` : index < currentIndex ? "100%" : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Story content */}
      <motion.div
        className="absolute inset-0 cursor-pointer"
        style={{ y }}
        drag="y"
        dragConstraints={{ top: -50, bottom: 50 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
      >
        {/* Background media */}
        {cardDetails.videoUrl ? (
          <video
            key={`video-${currentIndex}`}
            src={cardDetails.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted={isMuted}
            loop
            playsInline
          />
        ) : (
          <img
            key={`image-${currentIndex}`}
            src={cardDetails.imageUrl || cardDetails.image}
            alt={currentItem.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-bold mb-2">{currentItem.title}</h3>
          {cardDetails.description && (
            <p className="text-sm opacity-90 mb-4">{cardDetails.description}</p>
          )}

          {/* Call-to-action */}
          {cardDetails.link && (
            <motion.button
              className="bg-white text-black px-6 py-2 rounded-full font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStoryClick(currentItem, currentIndex)}
            >
              View Product
            </motion.button>
          )}
        </div>

        {/* Product tags */}
        {cardDetails.productTags?.map((tag, tagIndex) => (
          <motion.div
            key={tagIndex}
            className="absolute w-6 h-6 bg-white rounded-full border-2 border-black shadow-lg cursor-pointer z-20"
            style={{
              left: `${tag.position.x * 100}%`,
              top: `${tag.position.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + tagIndex * 0.1 }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-black rounded-full" />
            </div>
            {tag.label && (
              <motion.div
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + tagIndex * 0.1 }}
              >
                {tag.label}
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Controls */}
      <div className="absolute top-12 right-2 z-30 flex flex-col space-y-2">
        {/* Play/Pause */}
        <motion.button
          className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={togglePlayPause}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </motion.button>

        {/* Mute/Unmute (only for videos) */}
        {cardDetails.videoUrl && (
          <motion.button
            className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </motion.button>
        )}
      </div>

      {/* Story counter */}
      <div className="absolute top-12 left-2 z-30 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
        {currentIndex + 1} / {totalItems}
      </div>

      {/* Navigation hints */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {/* Left tap area hint */}
        <div className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-start pl-4">
          <motion.div
            className="text-white/50 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: currentIndex > 0 ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            ← Previous
          </motion.div>
        </div>

        {/* Right tap area hint */}
        <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-end pr-4">
          <motion.div
            className="text-white/50 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: currentIndex < totalItems - 1 ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            Next →
          </motion.div>
        </div>
      </div>
    </div>
  );
}
