"use client";

import { SwipeableModal } from "@/components/ui/bottom-sheet-modal";
import { StoryProgressBars } from "@/components/ui/story-progress-bars";
import { useModalCarousel } from "@/hooks/use-modal-router";
import type { Tile } from "@minimall/core/types/tiles";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, EyeOff, Pause, Play, ShoppingBag, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface InstagramPostModalProps {
  tiles: Tile[];
  onProductClick?: (productId: string) => void;
  onNavigate?: (url: string) => void;
}

export function InstagramPostModal({ tiles, onProductClick, onNavigate }: InstagramPostModalProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    modalState,
    currentItem: currentTile,
    currentIndex,
    canGoPrev,
    canGoNext,
    goToPrev,
    goToNext,
    closeModal,
  } = useModalCarousel(tiles, (tile) => tile.id, "post", "id");

  // Determine if current tile has video
  const isVideo = currentTile?.type !== "navigation" && currentTile?.media?.type === "video";
  const videoDuration = isVideo ? currentTile?.media?.duration : undefined;

  // Handle story progression
  const handleStoryComplete = useCallback(() => {
    if (canGoNext) {
      goToNext();
    } else {
      closeModal();
    }
  }, [canGoNext, goToNext, closeModal]);

  // Touch gesture handlers for hold-to-pause
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start hold timer
    holdTimeoutRef.current = setTimeout(() => {
      setIsPaused(true);
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }, 200);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Release pause
    setIsPaused(false);

    // Detect swipe gestures
    if (deltaTime < 300 && Math.abs(deltaY) < 50) {
      if (deltaX > 50 && canGoNext) {
        goToNext();
      } else if (deltaX < -50 && canGoPrev) {
        goToPrev();
      }
    }

    // Detect tap zones (left/right thirds for navigation)
    const screenWidth = window.innerWidth;
    const tapX = touch.clientX;
    
    if (deltaTime < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (tapX < screenWidth / 3 && canGoPrev) {
        goToPrev();
      } else if (tapX > (screenWidth * 2) / 3 && canGoNext) {
        goToNext();
      }
    }

    touchStartRef.current = null;
  }, [canGoPrev, canGoNext, goToPrev, goToNext]);

  // Video controls
  useEffect(() => {
    if (isVideo && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          // Autoplay might be blocked
          setIsVideoPlaying(false);
        });
      }
    }
  }, [isVideo, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (canGoPrev) goToPrev();
          break;
        case "ArrowRight":
          if (canGoNext) goToNext();
          break;
        case " ":
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        case "Escape":
          closeModal();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoPrev, canGoNext, goToPrev, goToNext, closeModal]);

  if (!modalState.isOpen || !currentTile) {
    return null;
  }

  return (
    <SwipeableModal isOpen={modalState.isOpen} onClose={closeModal} showCloseButton={false}>
      <div 
        className="relative w-full h-full bg-black"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Story Progress Bars */}
        <StoryProgressBars
          totalItems={tiles.length}
          currentIndex={currentIndex}
          isPaused={isPaused}
          onComplete={handleStoryComplete}
          duration={5000}
          isVideo={isVideo}
          videoDuration={videoDuration}
        />

        {/* User Info Bar */}
        <div className="absolute top-12 left-0 right-0 z-40 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                <div className="w-full h-full rounded-full bg-black p-0.5">
                  <div className="w-full h-full rounded-full bg-gray-300" />
                </div>
              </div>
              <span className="text-white font-semibold text-sm">your_brand</span>
            </div>
            
            <div className="flex items-center gap-2">
              {isVideo && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-white" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-white" />
                  )}
                </button>
              )}
              
              {currentTile.type === "shoppable" && (
                <button
                  onClick={() => setShowHotspots(!showHotspots)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
                >
                  {showHotspots ? (
                    <Eye className="w-4 h-4 text-white" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-white" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Navigation Zones (invisible) */}
          <button
            className="absolute left-0 top-0 w-1/3 h-full z-30"
            onClick={() => canGoPrev && goToPrev()}
            aria-label="Previous"
          />
          <button
            className="absolute right-0 top-0 w-1/3 h-full z-30"
            onClick={() => canGoNext && goToNext()}
            aria-label="Next"
          />

          {/* Media Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full"
            >
              {currentTile.type === "navigation" ? (
                // Navigation Tile
                <div
                  className="w-full h-full flex items-center justify-center p-8"
                  style={{
                    background: currentTile.background.type === "gradient" 
                      ? currentTile.background.value 
                      : currentTile.background.type === "color"
                      ? currentTile.background.value
                      : undefined,
                  }}
                  onClick={() => onNavigate?.(currentTile.link.url)}
                >
                  {currentTile.background.type === "image" && (
                    <Image
                      src={currentTile.background.value}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )}
                  <div 
                    className={`relative z-10 text-center ${
                      currentTile.text.alignment === "top-left" ? "self-start text-left" :
                      currentTile.text.alignment === "top-right" ? "self-start text-right ml-auto" :
                      currentTile.text.alignment === "bottom-left" ? "self-end text-left" :
                      currentTile.text.alignment === "bottom-right" ? "self-end text-right ml-auto" :
                      ""
                    }`}
                  >
                    <h2
                      className={`
                        ${currentTile.text.size === "small" ? "text-2xl" :
                          currentTile.text.size === "large" ? "text-6xl" :
                          currentTile.text.size === "xlarge" ? "text-7xl" :
                          "text-4xl"}
                        font-${currentTile.text.fontWeight}
                      `}
                      style={{ color: currentTile.text.color }}
                    >
                      {currentTile.text.primary}
                    </h2>
                    {currentTile.text.secondary && (
                      <p className="mt-2 opacity-80" style={{ color: currentTile.text.color }}>
                        {currentTile.text.secondary}
                      </p>
                    )}
                  </div>
                </div>
              ) : currentTile.media.type === "video" ? (
                // Video Content
                <video
                  ref={videoRef}
                  src={currentTile.media.url}
                  poster={currentTile.media.thumbnailUrl}
                  className="w-full h-full object-contain"
                  autoPlay
                  loop
                  playsInline
                  muted={isMuted}
                  data-ignore-progress={false}
                />
              ) : (
                // Image Content
                <div className="relative w-full h-full">
                  <Image
                    src={currentTile.media.url}
                    alt={currentTile.caption || ""}
                    fill
                    className="object-contain"
                    priority
                  />
                  
                  {/* Product Hotspots */}
                  {currentTile.type === "shoppable" && showHotspots && currentTile.hotspotsVisible && (
                    <div className="absolute inset-0">
                      {currentTile.products.map((tag, index) => (
                        <motion.button
                          key={tag.id}
                          className="absolute"
                          style={{
                            left: `${tag.position.x}%`,
                            top: `${tag.position.y}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => onProductClick?.(tag.productId)}
                        >
                          <div className={`
                            ${tag.pulseAnimation ? "animate-pulse" : ""}
                            ${currentTile.hotspotStyle === "numbered" 
                              ? "w-8 h-8 bg-white text-black font-semibold text-sm" 
                              : "w-3 h-3 bg-white"}
                            rounded-full flex items-center justify-center shadow-lg
                          `}>
                            {currentTile.hotspotStyle === "numbered" && (index + 1)}
                          </div>
                          {currentTile.hotspotStyle === "dot-text" && tag.label && (
                            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                              {tag.label}
                              {tag.price && <span className="ml-1 font-semibold">{tag.price}</span>}
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pause Overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 flex items-center justify-center z-50"
            >
              <Pause className="w-20 h-20 text-white/50" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SwipeableModal>
  );
}