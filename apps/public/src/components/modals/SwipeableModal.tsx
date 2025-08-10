"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { PixelUtils } from "../tracking/PixelDispatcher";

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
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--removed-body-scroll-bar-size, 0px)';
      
      // Track modal open event
      if (configId && blockId) {
        PixelUtils.dispatch('modal_open', {
          block_id: blockId,
          modal_type: 'product_quick_view',
        });
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, configId, blockId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Container */}
          <motion.div
            ref={containerRef}
            className={cn(
              "relative w-full max-w-lg mx-4 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl",
              "max-h-[90vh] sm:max-h-[80vh] overflow-hidden",
              className
            )}
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
              damping: 25,
              stiffness: 200,
            }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex-1">
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {title}
                  </h2>
                )}
                {showNavigation && totalItems > 1 && (
                  <p className="text-sm text-gray-500">
                    {currentIndex + 1} of {totalItems}
                  </p>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation (for multiple items) */}
            {showNavigation && totalItems > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={onPrevious}
                  disabled={currentIndex === 0}
                  className={cn(
                    "absolute left-4 top-1/2 transform -translate-y-1/2 z-10",
                    "w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg",
                    "flex items-center justify-center transition-all",
                    currentIndex === 0
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-white hover:scale-110 active:scale-95"
                  )}
                  aria-label="Previous item"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>

                {/* Next Button */}
                <button
                  onClick={onNext}
                  disabled={currentIndex === totalItems - 1}
                  className={cn(
                    "absolute right-4 top-1/2 transform -translate-y-1/2 z-10",
                    "w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg",
                    "flex items-center justify-center transition-all",
                    currentIndex === totalItems - 1
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:bg-white hover:scale-110 active:scale-95"
                  )}
                  aria-label="Next item"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Content Area with Horizontal Swipe Support */}
            <motion.div
              className="flex-1 overflow-y-auto"
              style={{ x }}
              drag={showNavigation ? "x" : false}
              dragConstraints={{ left: -50, right: 50 }}
              dragElastic={0.1}
              onDragEnd={showNavigation ? handleHorizontalSwipe : undefined}
            >
              {children}
            </motion.div>

            {/* Progress Dots (for multiple items) */}
            {showNavigation && totalItems > 1 && totalItems <= 10 && (
              <div className="flex justify-center space-x-2 py-4 border-t border-gray-100">
                {Array.from({ length: totalItems }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentIndex ? "bg-blue-600" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
            )}
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

  const openModal = (index: number = 0) => {
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