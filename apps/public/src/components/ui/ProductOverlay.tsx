"use client";

import { AnimatePresence, type PanInfo, motion, useDragControls } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { cn } from "../../lib/utils";

interface ProductTag {
  position: { x: number; y: number };
  label?: string;
  product?: {
    id: string;
    title: string;
    price: number;
    compareAtPrice?: number;
    image: string;
    available: boolean;
    variants?: Array<{
      id: string;
      title: string;
      price: number;
      available: boolean;
    }>;
  };
}

interface ProductOverlayProps {
  tag: ProductTag;
  tagIndex: number;
  onAddToCart: (productId: string, variantId?: string, quantity?: number) => void;
  className?: string;
}

export function ProductOverlay({ tag, tagIndex, onAddToCart, className }: ProductOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(tag.product?.variants?.[0]);
  const dragControls = useDragControls();

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tag.product) {
      onAddToCart(tag.product.id, selectedVariant?.id, quantity);
      setIsExpanded(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Add resistance when dragging up
    const dragThreshold = 100;
    if (info.offset.y > dragThreshold) {
      setIsExpanded(false);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Dismiss if dragged down more than 50px or with sufficient velocity
    const shouldDismiss = info.offset.y > 50 || info.velocity.y > 300;
    if (shouldDismiss) {
      setIsExpanded(false);
    }
  };

  if (!tag.product) {
    // Simple label tag without product
    return (
      <div
        className={cn(
          "absolute w-3 h-3 bg-white rounded-full border-2 border-black shadow-lg animate-pulse cursor-pointer",
          className
        )}
        style={{
          left: `${tag.position.x * 100}%`,
          top: `${tag.position.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        {tag.label && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
            {tag.label}
          </div>
        )}
      </div>
    );
  }

  const currentPrice = selectedVariant?.price ?? tag.product.price;
  const isOnSale = tag.product.compareAtPrice && tag.product.compareAtPrice > currentPrice;

  return (
    <>
      {/* Product Tag Dot */}
      <motion.div
        className={cn(
          "absolute w-6 h-6 bg-white rounded-full border-2 border-black shadow-lg cursor-pointer z-10",
          "flex items-center justify-center",
          isExpanded && "bg-black border-white",
          className
        )}
        style={{
          left: `${tag.position.x * 100}%`,
          top: `${tag.position.y * 100}%`,
          transform: "translate(-50%, -50%)",
        }}
        onClick={handleTagClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          scale: isExpanded ? 1.2 : 1,
        }}
      >
        <ShoppingBag className={cn("w-3 h-3", isExpanded ? "text-white" : "text-black")} />
      </motion.div>

      {/* Product Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
          >
            <motion.div
              className="w-full bg-white rounded-t-2xl p-4 shadow-2xl relative"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
              }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 300 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              whileDrag={{
                scale: 0.95,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Swipe Handle */}
              <div
                className="absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              />
              {/* Close Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Product Info */}
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={tag.product.image}
                    alt={tag.product.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                    {tag.product.title}
                  </h3>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-lg text-gray-900">
                      ${(currentPrice / 100).toFixed(2)}
                    </span>
                    {isOnSale && (
                      <span className="text-sm text-gray-500 line-through">
                        ${((tag.product.compareAtPrice ?? 0) / 100).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Variant Selector */}
                  {tag.product.variants && tag.product.variants.length > 1 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {tag.product.variants.map((variant) => (
                          <button
                            key={variant.id}
                            onClick={() => setSelectedVariant(variant)}
                            className={cn(
                              "px-2 py-1 text-xs rounded border transition-colors",
                              selectedVariant?.id === variant.id
                                ? "border-black bg-black text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400",
                              !variant.available && "opacity-50 cursor-not-allowed"
                            )}
                            disabled={!variant.available}
                          >
                            {variant.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity and Add to Cart */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        disabled={quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={
                        !tag.product.available || (selectedVariant && !selectedVariant.available)
                      }
                      className={cn(
                        "px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                        tag.product.available && (!selectedVariant || selectedVariant.available)
                          ? "bg-black text-white hover:bg-gray-800"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      )}
                    >
                      {tag.product.available && (!selectedVariant || selectedVariant.available)
                        ? "Add to Cart"
                        : "Out of Stock"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
