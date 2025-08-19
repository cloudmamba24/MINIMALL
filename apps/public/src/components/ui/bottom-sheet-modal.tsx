"use client";

import { AnimatePresence, motion, useAnimation, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface BottomSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Percentage heights (e.g., [25, 50, 90])
  defaultSnapPoint?: number;
  showHandle?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function BottomSheetModal({
  isOpen,
  onClose,
  children,
  snapPoints = [90],
  defaultSnapPoint = 0,
  showHandle = true,
  closeOnOverlayClick = true,
  className = "",
}: BottomSheetModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(defaultSnapPoint);
  const controls = useAnimation();
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      controls.start({
        y: `${100 - snapPoints[currentSnapIndex]}%`,
        transition: { type: "spring", damping: 30, stiffness: 300 },
      });
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, currentSnapIndex, snapPoints, controls]);

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 50;
    const velocity = info.velocity.y;
    const shouldClose = velocity > 500 || info.offset.y > 200;

    if (shouldClose) {
      onClose();
      return;
    }

    // Find nearest snap point
    const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
    const currentY = info.point.y;
    const currentPercent = (currentY / containerHeight) * 100;

    let nearestIndex = 0;
    let minDistance = Infinity;

    snapPoints.forEach((point, index) => {
      const distance = Math.abs(100 - point - currentPercent);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    setCurrentSnapIndex(nearestIndex);
    controls.start({
      y: `${100 - snapPoints[nearestIndex]}%`,
      transition: { type: "spring", damping: 30, stiffness: 300 },
    });
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          ref={containerRef}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Bottom Sheet */}
          <motion.div
            className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl ${className}`}
            style={{ height: `${Math.max(...snapPoints)}%` }}
            initial={{ y: "100%" }}
            animate={controls}
            exit={{ y: "100%" }}
            drag="y"
            dragControls={dragControls}
            dragElastic={0.2}
            dragConstraints={{ top: 0 }}
            onDragEnd={handleDragEnd}
            ref={contentRef}
          >
            {/* Handle */}
            {showHandle && (
              <div
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}

// Swipeable Modal for full-screen content
export function SwipeableModal({
  isOpen,
  onClose,
  children,
  showCloseButton = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSwipeDown = (_: any, info: any) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full h-full"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleSwipeDown}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Swipe Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
              <div className="w-12 h-1 bg-white/50 rounded-full" />
            </div>

            {/* Close Button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white z-50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Content */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}