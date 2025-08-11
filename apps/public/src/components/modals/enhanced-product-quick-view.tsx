"use client";

import { SidePanel } from "@/components/ui/enhanced-modal";
import { useModalRouter } from "@/hooks/use-modal-router";
import { useShopDomain, useShopifyProduct } from "@/hooks/use-shopify-product";
import { animationPresets } from "@/lib/animation-tokens";
import { useAddToCart } from "@/store/app-store";
import {
  calculateDiscountPercentage,
  findVariantByOptions,
  formatPrice,
  getOptionValues,
} from "@minimall/core/client";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Minus, Plus, Star } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";

/**
 * Enhanced Product Quick View
 *
 * Slides in gracefully from the right, never disrupting the user's context.
 * Every interaction is optimized for speed and delight.
 */
export function EnhancedProductQuickView() {
  const { modalState, closeModal } = useModalRouter("product");
  const { openModal: openCartModal } = useModalRouter("cart");
  const addToCart = useAddToCart();
  const shopDomain = useShopDomain();

  const productId = modalState.data.id;
  const { product, loading, error } = useShopifyProduct(productId, shopDomain);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Initialize selected options when product loads
  useEffect(() => {
    if (product && product.variants.length > 0) {
      const firstVariant = product.variants[0];
      if (firstVariant) {
        const options: Record<string, string> = {};
        firstVariant.selectedOptions.forEach((option: { name: string; value: string }) => {
          options[option.name] = option.value;
        });
        setSelectedOptions(options);
      }
    }
  }, [product]);

  // Find selected variant based on current options
  const selectedVariant =
    product && Object.keys(selectedOptions).length > 0
      ? findVariantByOptions(product, selectedOptions)
      : product?.variants[0];

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;

    setIsAddingToCart(true);

    const optionsString = selectedVariant.selectedOptions
      .map((opt: { name: string; value: string }) => opt.value)
      .join(" / ");

    addToCart({
      id: `${product.id}-${selectedVariant.id}`,
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      price: Math.round(Number.parseFloat(selectedVariant.price.amount) * 100), // Convert to cents
      quantity,
      image: selectedVariant.image?.url || product.images[0]?.url || "",
      variant: {
        title: optionsString,
        selectedOptions: selectedVariant.selectedOptions,
      },
    });

    setIsAddingToCart(false);
    // Optimistically reveal the cart drawer for a cohesive flow
    openCartModal({ open: "true" });
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  // Show loading state
  if (loading) {
    return (
      <SidePanel isOpen={modalState.isOpen} onClose={closeModal} width="lg" pushContent={true}>
        <div className="space-y-6 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-xl" />
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </SidePanel>
    );
  }

  // Show error state
  if (error) {
    return (
      <SidePanel isOpen={modalState.isOpen} onClose={closeModal} width="lg" pushContent={true}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading product</div>
            <div className="text-sm text-gray-500">{error}</div>
          </div>
        </div>
      </SidePanel>
    );
  }

  if (!product) return null;

  const currentPrice = selectedVariant?.price?.amount
    ? Number.parseFloat(selectedVariant.price.amount)
    : 0;
  const compareAtPrice = selectedVariant?.compareAtPrice?.amount
    ? Number.parseFloat(selectedVariant.compareAtPrice.amount)
    : 0;
  const discount =
    compareAtPrice > 0 ? calculateDiscountPercentage(compareAtPrice, currentPrice) : 0;

  // Get unique option names and values
  const optionNames = [
    ...new Set(product.variants.flatMap((v) => v.selectedOptions.map((o) => o.name))),
  ];

  return (
    <SidePanel isOpen={modalState.isOpen} onClose={closeModal} width="lg" pushContent={true}>
      <div className="space-y-6">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <motion.div
            className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden"
            layout
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImage}
                className="relative w-full h-full"
                {...animationPresets.crossFade}
              >
                <Image
                  src={
                    product.images[selectedImage]?.url ||
                    product.images[0]?.url ||
                    "/placeholder.jpg"
                  }
                  alt={product.images[selectedImage]?.altText || product.title}
                  fill
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>

            {/* Like button */}
            <motion.button
              onClick={() => setIsLiked(!isLiked)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart
                size={18}
                className={isLiked ? "text-red-500 fill-red-500" : "text-gray-600"}
              />
            </motion.button>
          </motion.div>

          {/* Thumbnail Images */}
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((image, index) => (
                <motion.button
                  key={image.id || index}
                  onClick={() => setSelectedImage(index)}
                  className={`
                    relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors
                    ${selectedImage === index ? "border-black" : "border-transparent"}
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src={image.url}
                    alt={image.altText || `${product.title} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Title and Rating */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h2>

            {/* Reviews would come from a separate API or be part of product data */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">4.0 (24 reviews)</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gray-900">{formatPrice(currentPrice)}</span>
            {compareAtPrice > 0 && discount > 0 && (
              <>
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(compareAtPrice)}
                </span>
                <span className="px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded">
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">{product.description}</p>

          {/* Tags as Features */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.slice(0, 6).map((tag, index) => (
                <motion.span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Variant Selection */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {optionNames.map((optionName) => {
            const optionValues = getOptionValues(product, optionName);
            const selectedValue = selectedOptions[optionName];

            return (
              <div key={optionName}>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {optionName}: {selectedValue}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {optionValues.map((value: string) => (
                    <motion.button
                      key={value}
                      onClick={() => handleOptionChange(optionName, value)}
                      className={`
                        px-4 py-2 border rounded-lg font-medium transition-colors
                        ${
                          selectedValue === value
                            ? "border-black bg-black text-white"
                            : "border-gray-300 text-gray-900 hover:border-gray-400"
                        }
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {value}
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Quantity Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Minus size={16} />
              </motion.button>

              <span className="w-12 text-center font-medium text-lg">{quantity}</span>

              <motion.button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Add to Cart Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <motion.button
            onClick={handleAddToCart}
            disabled={isAddingToCart || !selectedVariant?.availableForSale}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-white transition-colors
              ${
                isAddingToCart || !selectedVariant?.availableForSale
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
              }
            `}
            whileHover={!isAddingToCart && selectedVariant?.availableForSale ? { scale: 1.02 } : {}}
            whileTap={!isAddingToCart && selectedVariant?.availableForSale ? { scale: 0.98 } : {}}
            animate={isAddingToCart ? animationPresets.addToCart?.animate : {}}
          >
            {isAddingToCart ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding to Cart...
              </div>
            ) : !selectedVariant?.availableForSale ? (
              "Out of Stock"
            ) : (
              `Add to Cart • ${formatPrice(currentPrice * quantity)}`
            )}
          </motion.button>
        </motion.div>
      </div>
    </SidePanel>
  );
}
