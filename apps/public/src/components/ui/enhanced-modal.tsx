"use client";

import { animationPresets, animationTokens } from "@/lib/animation-tokens";
import FocusTrap from "focus-trap-react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

/**
 * Enhanced Modal Component
 *
 * The foundation of our "App-in-a-Tab" experience. Every modal is a stage,
 * every entrance is choreographed, every exit is graceful.
 */
export function EnhancedModal({
  isOpen,
  onClose,
  children,
  className = "",
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: EnhancedModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent scroll when modal is open
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

  // Focus management: trap and restore focus to previously focused element
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Move focus to modal container when opened
    const container = document.getElementById("enhanced-modal-container");
    if (container) {
      // Delay to ensure element is mounted
      setTimeout(() => container.focus(), 0);
    }
    return () => {
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw] max-h-[95vh]",
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop with gentle fade */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeOnBackdropClick ? onClose : undefined}
            {...animationPresets.backdropFade}
          />

          {/* Modal container */}
          <FocusTrap active={isOpen} focusTrapOptions={{ allowOutsideClick: true }}>
            <div
              id="enhanced-modal-container"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
            >
              <motion.div
                className={`
                relative bg-white rounded-xl shadow-2xl
                max-h-[90vh] overflow-hidden
                ${sizeClasses[size]}
                ${className}
              `}
                {...animationPresets.modalEntrance}
              >
                {/* Close button */}
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="
                    absolute top-4 right-4 z-10
                    w-8 h-8 rounded-full
                    bg-gray-100 hover:bg-gray-200
                    flex items-center justify-center
                    transition-colors duration-200
                  "
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <X size={16} className="text-gray-600" />
                  </motion.button>
                )}

                {/* Modal content */}
                <div className="relative max-h-[90vh] overflow-auto">{children}</div>
              </motion.div>
            </div>
          </FocusTrap>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Side Panel Modal - slides in from the right
 */
interface SidePanelProps extends Omit<EnhancedModalProps, "size"> {
  width?: "sm" | "md" | "lg";
  pushContent?: boolean; // Whether to push the main content when panel opens
}

export function SidePanel({
  isOpen,
  onClose,
  children,
  className = "",
  width = "md",
  pushContent = false,
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
}: SidePanelProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  const widthClasses = {
    sm: "sm:w-80",
    md: "sm:w-96",
    lg: "sm:w-[28rem]",
  } as const;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={closeOnBackdropClick ? onClose : undefined}
            {...animationPresets.backdropFade}
          />

          {/* Side panel */}
          <motion.div
            className={`
              fixed top-0 right-0 h-full bg-white shadow-2xl z-50
              overflow-hidden flex flex-col
              w-full ${widthClasses[width]}
              ${className}
            `}
            {...animationPresets.panelSlideIn}
          >
            {/* Close button */}
            {showCloseButton && (
              <motion.button
                onClick={onClose}
                className="
                  absolute top-4 left-4 z-10
                  w-8 h-8 rounded-full
                  bg-gray-100 hover:bg-gray-200
                  flex items-center justify-center
                  transition-colors duration-200
                "
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={16} className="text-gray-600" />
              </motion.button>
            )}

            {/* Panel content */}
            <div className="flex-1 overflow-auto p-6 pt-16">{children}</div>
          </motion.div>

          {/* Content push effect */}
          {pushContent && (
            <motion.div
              className="fixed inset-0 pointer-events-none z-30"
              initial={{ x: 0 }}
              animate={{ x: -animationTokens.transform.slideDistance }}
              exit={{ x: 0 }}
              transition={{
                duration: animationTokens.duration.slow / 1000,
                ease: animationTokens.easing.slide,
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
