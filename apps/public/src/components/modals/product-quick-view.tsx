"use client";

import { useShopDomain, useShopifyProduct } from "@/hooks/use-shopify-product";
import { useAddToCart, useCloseProductQuickView, useModals } from "@/store/app-store";
import {
  calculateDiscountPercentage,
  findVariantByOptions,
  formatPrice,
  getOptionValues,
} from "@minimall/core/client";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Minus, Plus, Star, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface ProductQuickViewProps {
  animationSettings?: {
    slideIn: number;
  };
}

export function ProductQuickView({ animationSettings }: ProductQuickViewProps) {
  const modals = useModals();
  const closeProductQuickView = useCloseProductQuickView();
  const addToCart = useAddToCart();
  const shopDomain = useShopDomain();

  const productId = modals.productQuickView.productId;
  const { product, loading, error } = useShopifyProduct(productId || "", shopDomain);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
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

    try {

      const optionsString = selectedVariant.selectedOptions
        .map((opt: { name: string; value: string }) => opt.value)
        .join(" / ");

      addToCart({
        id: `${product.id}-${selectedVariant.id}`,
        productId: product.id,
        variantId: selectedVariant.id,
        title: product.title,
        price: Math.round(Number.parseFloat(selectedVariant.price.amount) * 100),
        quantity,
        image: selectedVariant.image?.url || product.images[0]?.url || "",
        variant: {
          title: optionsString,
          selectedOptions: selectedVariant.selectedOptions,
        },
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  if (!modals.productQuickView.isOpen) return null;

  // Loading state
  if (loading) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="animate-pulse space-y-4">
              <div className="aspect-square bg-gray-200 rounded" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md text-center">
            <p className="text-red-500 mb-2">Error loading product</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={closeProductQuickView}
              className="mt-4 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const currentPrice = selectedVariant?.price?.amount
    ? Number.parseFloat(selectedVariant.price.amount)
    : 0;
  const compareAtPrice = selectedVariant?.compareAtPrice?.amount
    ? Number.parseFloat(selectedVariant.compareAtPrice.amount)
    : 0;
  const discount =
    compareAtPrice > 0 ? calculateDiscountPercentage(compareAtPrice, currentPrice) : 0;

  // Get unique option names
  const optionNames = [
    ...new Set(product.variants.flatMap((v) => v.selectedOptions.map((o) => o.name))),
  ];

  const slideInDuration = animationSettings?.slideIn || 300;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={closeProductQuickView}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: slideInDuration / 1000 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col md:flex-row h-full">
            {/* Images Section */}
            <div className="md:w-1/2 relative">
              <button
                type="button"
                onClick={closeProductQuickView}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X size={16} />
              </button>

              {/* Main Image */}
              <div className="aspect-square relative bg-gray-100">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImage}
                    src={
                      product.images[selectedImage]?.url ||
                      product.images[0]?.url ||
                      "/placeholder.jpg"
                    }
                    alt={product.images[selectedImage]?.altText || product.title}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                </AnimatePresence>

                {/* Like Button */}
                <button
                  type="button"
                  className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center"
                >
                  <Heart size={18} className="text-gray-600" />
                </button>
              </div>

              {/* Thumbnail Images */}
              {product.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      type="button"
                      key={image.id || index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                        selectedImage === index ? "border-black" : "border-transparent"
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={image.altText || `${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="md:w-1/2 p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Title and Rating */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{product.title}</h2>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">4.0 (24 reviews)</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold">{formatPrice(currentPrice)}</span>
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
                <p className="text-gray-600">{product.description}</p>

                {/* Options */}
                <div className="space-y-4">
                  {optionNames.map((optionName) => {
                    const optionValues = getOptionValues(product, optionName);
                    const selectedValue = selectedOptions[optionName];

                    return (
                      <div key={optionName}>
                        <label className="block text-sm font-medium mb-2">
                          {optionName}: {selectedValue}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {optionValues.map((value: string) => (
                            <button
                              type="button"
                              key={value}
                              onClick={() => handleOptionChange(optionName, value)}
                              className={`px-3 py-2 border rounded font-medium text-sm ${
                                selectedValue === value
                                  ? "border-black bg-black text-white"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add to Cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !selectedVariant?.availableForSale}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
                    isAddingToCart || !selectedVariant?.availableForSale
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-black hover:bg-gray-800"
                  }`}
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
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
