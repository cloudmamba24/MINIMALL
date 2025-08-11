"use client";

import { AnimatePresence, type PanInfo, motion, useMotionValue, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { PixelUtils } from "../tracking/PixelDispatcher";
import "../../styles/instagram-native.css";

interface SwipeableModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showNavigation?: boolean;
  currentIndex?: number;
  totalItems?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  configId?: string;
  blockId?: string;
  className?: string;
}

/**
 * SwipeableModal - Mobile-Native Modal with Gesture Support
 *
 * Features:
 * - Swipe-to-close (down gesture)
 * - Swipe navigation (left/right for multiple items)
 * - Touch-optimized interactions
 * - Analytics event tracking
 * - Backdrop blur and lock scroll
 * - Spring-based animations
 * - Accessibility support
 */
export function SwipeableModal({
  isOpen,
  onClose,
  children,
  title,
  showNavigation = false,
  currentIndex = 0,
  totalItems = 1,
  onPrevious,
  onNext,
  configId,
  blockId,
  className,
}: SwipeableModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for swipe gestures
  const y = useMotionValue(0);
  const x = useMotionValue(0);

  // Transform opacity based on drag distance
  const opacity = useTransform(y, [0, 100], [1, 0.7]);
  const scale = useTransform(y, [0, 100], [1, 0.95]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "var(--removed-body-scroll-bar-size, 0px)";

      // Track modal open event
      if (configId && blockId) {
        PixelUtils.dispatch("modal_open", {
          block_id: blockId,
          modal_type: "product_quick_view",
        });
      }
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, configId, blockId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle vertical drag (swipe to close)
  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);

    const { offset, velocity } = info;
    const dragThreshold = 100;
    const velocityThreshold = 500;

    // Close modal if dragged down significantly or with enough velocity
    if (offset.y > dragThreshold || velocity.y > velocityThreshold) {
      onClose();
    } else {
      // Reset position
      y.set(0);
    }
  };

  // Handle horizontal swipe for navigation
  const handleHorizontalSwipe = (event: any, info: PanInfo) => {
    if (!showNavigation) return;

    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 300;

    if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
      if (offset.x > 0 && onPrevious && currentIndex > 0) {
        onPrevious();
      } else if (offset.x < 0 && onNext && currentIndex < totalItems - 1) {
        onNext();
      }
    }

    // Reset position
    x.set(0);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="instagram-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--ig-backdrop)" }}
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Container */}
          <motion.div
            ref={containerRef}
            className={cn("instagram-modal-content", className)}
            style={{
              y,
              opacity,
              scale,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
          >
            {/* Story Progress (for multiple items) */}
            {showNavigation && totalItems > 1 && (
              <div className="instagram-story-progress">
                {Array.from({ length: totalItems }).map((_, index) => (
                  <div key={index} className="instagram-story-progress-bar">
                    <div
                      className={cn(
                        "instagram-story-progress-fill",
                        index <= currentIndex && "active"
                      )}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Header */}
            <div className="instagram-modal-header">
              <div className="flex-1">
                {title && <h2 className="text-white font-semibold truncate">{title}</h2>}
                {showNavigation && totalItems > 1 && (
                  <p className="text-xs" style={{ color: "var(--ig-text-secondary)" }}>
                    {currentIndex + 1} of {totalItems}
                  </p>
                )}
              </div>

              <button onClick={onClose} className="instagram-modal-close" aria-label="Close modal">
                <X />
              </button>
            </div>

            {/* Navigation (for multiple items) */}
            {showNavigation && totalItems > 1 && (
              <>
                {/* Previous Button */}
                {currentIndex > 0 && (
                  <button
                    onClick={onPrevious}
                    className="instagram-swipe-indicator left"
                    aria-label="Previous item"
                  >
                    <ChevronLeft />
                  </button>
                )}

                {/* Next Button */}
                {currentIndex < totalItems - 1 && (
                  <button
                    onClick={onNext}
                    className="instagram-swipe-indicator right"
                    aria-label="Next item"
                  >
                    <ChevronRight />
                  </button>
                )}
              </>
            )}

            {/* Content Area with Horizontal Swipe Support */}
            <motion.div
              className="flex-1 overflow-y-auto"
              style={{ x }}
              drag={showNavigation ? "x" : false}
              dragConstraints={{ left: -50, right: 50 }}
              dragElastic={0.1}
              {...(showNavigation ? { onDragEnd: handleHorizontalSwipe } : {})}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook for managing swipeable modal state with navigation
 */
export function useSwipeableModal(items: any[] = []) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (index = 0) => {
    setCurrentIndex(Math.max(0, Math.min(index, items.length - 1)));
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const goToNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentItem = items[currentIndex];

  return {
    isOpen,
    currentIndex,
    currentItem,
    totalItems: items.length,
    openModal,
    closeModal,
    goToNext,
    goToPrevious,
  };
}
