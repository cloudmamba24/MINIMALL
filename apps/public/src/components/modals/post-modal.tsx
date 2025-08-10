"use client";

import { useClosePostModal, useModals, useOpenProductQuickView } from "@/store/app-store";
import type { Category } from "@minimall/core/client";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { ProductTag } from "./product-tag";

interface PostModalProps {
  post?: Category | null;
  animationSettings?: {
    fadeIn: number;
    backdrop: {
      opacity: number;
      blur: number;
    };
  };
}

export function PostModal({ post, animationSettings }: PostModalProps) {
  const modals = useModals();
  const closePostModal = useClosePostModal();
  const openProductQuickView = useOpenProductQuickView();

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePostModal();
      }
    };

    if (modals.postModal.isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [modals.postModal.isOpen, closePostModal]);

  if (!modals.postModal.isOpen || !post) return null;

  const [_cardType, cardDetails] = post.card;
  const fadeInDuration = (animationSettings?.fadeIn ?? 200) / 1000;
  const backdropOpacity = animationSettings?.backdrop?.opacity ?? 0.8;
  const backdropBlur = animationSettings?.backdrop?.blur ?? 4;

  const handleProductTagClick = (productId: string) => {
    openProductQuickView(productId);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closePostModal();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: fadeInDuration }}
        className={"fixed inset-0 z-50 flex items-center justify-center p-4"}
        style={{
          backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
          backdropFilter: `blur(${backdropBlur}px)`,
        }}
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: fadeInDuration }}
          className="bg-black border border-gray-800 rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col lg:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={closePostModal}
            className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Image Section */}
          <div className="flex-1 relative bg-gray-900 min-h-[400px] lg:min-h-[600px]">
            <img
              src={cardDetails.image || cardDetails.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />

            {/* Product Tags */}
            {cardDetails.productTags?.map((tag, index) => (
              <ProductTag
                key={index}
                tag={tag}
                onTagClick={() => handleProductTagClick(tag.productId)}
              />
            ))}
          </div>

          {/* Content Section */}
          <div className="lg:w-96 flex flex-col bg-black text-white">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-xs">D</span>
                </div>
                <span className="font-medium">DEMO.STORE</span>
              </div>
              <h3 className="text-lg font-medium mb-2">{post.title}</h3>
              {cardDetails.description && (
                <p className="text-gray-400 text-sm leading-relaxed">{cardDetails.description}</p>
              )}
            </div>

            {/* Products in this image */}
            {cardDetails.productTags && cardDetails.productTags.length > 0 && (
              <div className="flex-1 p-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Products in this image
                </h4>
                <div className="space-y-3">
                  {cardDetails.productTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => handleProductTagClick(tag.productId)}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-gray-700 transition-colors w-full text-left group"
                    >
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{tag.label || `Product ${index + 1}`}</p>
                        <p className="text-gray-400 text-xs">Tap to view details</p>
                      </div>
                      <div className="text-gray-400 group-hover:text-white transition-colors">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
