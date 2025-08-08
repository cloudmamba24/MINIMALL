'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { EnhancedModal } from '@/components/ui/enhanced-modal';
import { useModalCarousel } from '@/hooks/use-modal-router';
import { animationPresets, animationTokens } from '@/lib/animation-tokens';
import type { Category } from '@minimall/core';

interface EnhancedPostModalProps {
  posts: Category[];
  onProductClick?: (productId: string) => void;
}

interface LocalProductTag {
  productId: string;
  position: { x: number; y: number };
  label: string;
  price?: string;
}

/**
 * Enhanced Post Modal with Carousel Navigation
 * 
 * The crown jewel of the "App-in-a-Tab" experience. Users can navigate
 * through posts without ever losing context, with silky smooth animations
 * and delightful micro-interactions.
 */
export function EnhancedPostModal({ posts, onProductClick }: EnhancedPostModalProps) {
  const [showProductTags, setShowProductTags] = useState(false);
  
  const {
    modalState,
    currentItem: currentPost,
    currentIndex,
    canGoPrev,
    canGoNext,
    goToPrev,
    goToNext,
    closeModal,
  } = useModalCarousel(
    posts,
    (post) => post.id,
    'post',
    'id'
  );

  // Extract product tags from current post
  const productTags = useMemo((): LocalProductTag[] => {
    if (!currentPost?.children?.[0]?.card) return [];
    
    const [, cardDetails] = currentPost.children[0].card;
    const coreTags = cardDetails.productTags || [];
    
    // Convert core ProductTag to LocalProductTag format
    return coreTags.map(tag => {
      const localTag: LocalProductTag = {
        productId: tag.productId,
        position: tag.position,
        label: tag.label || 'Product',
      };
      // Only add price if it exists
      // In a real app, you'd look up product data here
      return localTag;
    });
  }, [currentPost]);

  // Get post image
  const postImage = useMemo(() => {
    if (!currentPost?.children?.[0]?.card) return '';
    
    const [, cardDetails] = currentPost.children[0].card;
    return cardDetails.image || cardDetails.imageUrl || '';
  }, [currentPost]);

  const handleProductTagClick = (productId: string) => {
    onProductClick?.(productId);
  };

  if (!modalState.isOpen || !currentPost) {
    return null;
  }

  return (
    <EnhancedModal
      isOpen={modalState.isOpen}
      onClose={closeModal}
      size="xl"
      className="bg-black text-white"
    >
      <div className="flex h-[80vh]">
        {/* Left side - Image with product tags */}
        <div className="flex-1 relative bg-gray-900">
          {/* Navigation arrows */}
          <AnimatePresence>
            {canGoPrev && (
              <motion.button
                onClick={goToPrev}
                className="
                  absolute top-1/2 left-4 z-20 -translate-y-1/2
                  w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm
                  flex items-center justify-center text-white
                  hover:bg-black/70 transition-colors
                "
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft size={24} />
              </motion.button>
            )}
            
            {canGoNext && (
              <motion.button
                onClick={goToNext}
                className="
                  absolute top-1/2 right-4 z-20 -translate-y-1/2
                  w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm
                  flex items-center justify-center text-white
                  hover:bg-black/70 transition-colors
                "
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronRight size={24} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Post counter */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-sm">
            {currentIndex + 1} / {posts.length}
          </div>

          {/* Toggle product tags button */}
          {productTags.length > 0 && (
            <motion.button
              onClick={() => setShowProductTags(!showProductTags)}
              className="
                absolute bottom-4 left-4 z-10
                px-4 py-2 bg-white text-black rounded-full
                flex items-center gap-2 font-medium
                hover:bg-gray-100 transition-colors
              "
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showProductTags ? <EyeOff size={16} /> : <Eye size={16} />}
              {showProductTags ? 'Hide Products' : 'View Products'}
            </motion.button>
          )}

          {/* Main image with crossfade animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPost.id}
              className="relative w-full h-full"
              {...animationPresets.crossFade}
            >
              {postImage && (
                <Image
                  src={postImage}
                  alt={currentPost.title}
                  fill
                  className="object-cover"
                  priority
                />
              )}
              
              {/* Product tags with staggered animation */}
              <AnimatePresence>
                {showProductTags && productTags.map((tag, index) => (
                  <motion.button
                    key={tag.productId}
                    onClick={() => handleProductTagClick(tag.productId)}
                    className="
                      absolute w-6 h-6 bg-white rounded-full
                      flex items-center justify-center shadow-lg
                      hover:scale-110 transition-transform
                      before:absolute before:inset-0 before:bg-white before:rounded-full
                      before:animate-ping before:opacity-75
                    "
                    style={{
                      left: `${tag.position.x * 100}%`,
                      top: `${tag.position.y * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    initial={animationPresets.productTag.initial}
                    animate={animationPresets.productTag.animate}
                    exit={animationPresets.productTag.exit}
                    transition={{
                      ...animationPresets.productTag.transition,
                      delay: index * (animationTokens.duration.stagger / 1000),
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ShoppingBag size={12} className="text-black" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right side - Post details and products */}
        <div className="w-80 p-6 bg-gray-900 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPost.id}
              {...animationPresets.crossFade}
            >
              {/* Post title with slide animation */}
              <motion.h2 
                className="text-2xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.1,
                  duration: animationTokens.duration.normal / 1000,
                  ease: animationTokens.easing.entrance,
                }}
              >
                {currentPost.title}
              </motion.h2>
              
              {/* Product grid */}
              {productTags.length > 0 && (
                <motion.div
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.2,
                    duration: animationTokens.duration.normal / 1000,
                    ease: animationTokens.easing.entrance,
                  }}
                >
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">
                    Featured Products
                  </h3>
                  
                  {productTags.map((tag, index) => (
                    <motion.button
                      key={tag.productId}
                      onClick={() => handleProductTagClick(tag.productId)}
                      className="
                        w-full p-3 bg-gray-800 rounded-lg
                        hover:bg-gray-700 transition-colors
                        text-left flex items-center gap-3
                      "
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.3 + (index * 0.1),
                        duration: animationTokens.duration.fast / 1000,
                        ease: animationTokens.easing.entrance,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <ShoppingBag size={16} className="text-black" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium">{tag.label}</div>
                        {tag.price && (
                          <div className="text-sm text-gray-400">{tag.price}</div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
              
              {/* Post description if available */}
              {currentPost.children?.[0] && (
                <motion.div
                  className="mt-6 pt-6 border-t border-gray-700"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: 0.4,
                    duration: animationTokens.duration.normal / 1000,
                    ease: animationTokens.easing.entrance,
                  }}
                >
                  <p className="text-gray-300 leading-relaxed">
                    Explore this curated look and discover the products that make it special.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </EnhancedModal>
  );
}