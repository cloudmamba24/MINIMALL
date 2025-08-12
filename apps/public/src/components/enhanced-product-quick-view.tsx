"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Minus, Plus, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useShopifyCart } from "../hooks/use-shopify-cart";
import type { ShopifyProduct } from "../lib/shopify-client";
import { useAppStore } from "../store/app-store";

interface ProductOption {
  name: string;
  value: string;
}

interface ProductVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
  compareAtPrice?: { amount: string; currencyCode: string };
  availableForSale: boolean;
  selectedOptions: ProductOption[];
  image?: {
    url: string;
    altText?: string;
  };
}

/**
 * Enhanced Product Quick View Modal
 *
 * Uses the existing modal system but with URL-based routing support
 */
export function EnhancedProductQuickView() {
  const { modals, closeProductQuickView } = useAppStore();
  const { addToShopifyCart, isLoading: isAddingToCart } = useShopifyCart();

  const { isOpen, productId, product: initialProduct } = modals.productQuickView;

  const [product, setProduct] = useState<ShopifyProduct | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  // Fetch product if not provided
  useEffect(() => {
    if (!isOpen || !productId || initialProduct) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use Shopify client directly instead of non-existent API
        const { ShopifyClient } = await import("../lib/shopify-client");

        // Get shop domain and access token from config or environment
        const shopDomain = "demo-shop.myshopify.com"; // This should come from config context
        const accessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

        if (!accessToken) {
          throw new Error("Shopify access token not configured");
        }

        const client = new ShopifyClient(shopDomain, accessToken);
        const product = await client.getProduct(productId);

        if (!product) {
          throw new Error("Product not found");
        }

        setProduct(product);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [isOpen, productId, initialProduct]);

  // Initialize selected options when product loads
  useEffect(() => {
    if (product && product.variants.length > 0) {
      const firstVariant = product.variants[0] as ProductVariant;
      if (firstVariant) {
        const options: Record<string, string> = {};
        for (const option of firstVariant.selectedOptions) {
          options[option.name] = option.value;
        }
        setSelectedOptions(options);
      }
    }
  }, [product]);

  // Find selected variant
  const selectedVariant =
    product && Object.keys(selectedOptions).length > 0
      ? (product.variants.find((v) =>
          (v as ProductVariant).selectedOptions.every(
            (option) => selectedOptions[option.name] === option.value
          )
        ) as ProductVariant)
      : (product?.variants[0] as ProductVariant);

  const handleAddToCart = async () => {
    if (!product || !selectedVariant) return;

    try {
      await addToShopifyCart(product, selectedVariant.id, quantity);
      // Modal automatically opens cart drawer
    } catch (error) {
      console.error("Add to cart failed:", error);
    }
  };

  const handleClose = () => {
    closeProductQuickView();
    // Reset state
    setProduct(null);
    setSelectedImage(0);
    setSelectedOptions({});
    setQuantity(1);
    setError(null);
  };

  if (!isOpen) return null;

  const formatPrice = (amount: string) => `$${Number.parseFloat(amount).toFixed(2)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white rounded-2xl p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Loading State */}
          {loading && (
            <div className="space-y-6 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-xl" />
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="text-red-500 mb-2">Error loading product</div>
                <div className="text-sm text-gray-500">{error}</div>
              </div>
            </div>
          )}

          {/* Product Content */}
          {product && !loading && !error && (
            <div className="space-y-6">
              {/* Product Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={
                      product.images[selectedImage]?.url ||
                      product.images[0]?.url ||
                      "/placeholder.jpg"
                    }
                    alt={product.images[selectedImage]?.altText || product.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => setIsLiked(!isLiked)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center"
                  >
                    <Heart
                      size={18}
                      className={isLiked ? "text-red-500 fill-red-500" : "text-gray-600"}
                    />
                  </button>
                </div>

                {/* Thumbnail Images */}
                {product.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto">
                    {product.images.map((image, index) => (
                      <button
                        type="button"
                        key={image.id || index}
                        onClick={() => setSelectedImage(index)}
                        className={`
                          flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors
                          ${selectedImage === index ? "border-black" : "border-transparent"}
                        `}
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

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h2>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      {selectedVariant && formatPrice(selectedVariant.price.amount)}
                    </span>
                    {selectedVariant?.compareAtPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(selectedVariant.compareAtPrice.amount)}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 leading-relaxed">{product.description}</p>

                {/* Variant Selection */}
                {product.variants.length > 1 && (
                  <div className="space-y-4">
                    {/* Get option names */}
                    {Array.from(
                      new Set(
                        product.variants.flatMap((v) =>
                          (v as ProductVariant).selectedOptions.map((o) => o.name)
                        )
                      )
                    ).map((optionName) => {
                      // Get values for this option
                      const optionValues = Array.from(
                        new Set(
                          product.variants.flatMap((v) =>
                            (v as ProductVariant).selectedOptions
                              .filter((o) => o.name === optionName)
                              .map((o) => o.value)
                          )
                        )
                      );

                      return (
                        <div key={optionName}>
                          <div className="block text-sm font-medium text-gray-900 mb-2">
                            {optionName}: {selectedOptions[optionName]}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {optionValues.map((value) => (
                              <button
                                type="button"
                                key={value}
                                onClick={() =>
                                  setSelectedOptions((prev) => ({ ...prev, [optionName]: value }))
                                }
                                className={`
                                  px-4 py-2 border rounded-lg font-medium transition-colors
                                  ${
                                    selectedOptions[optionName] === value
                                      ? "border-black bg-black text-white"
                                      : "border-gray-300 text-gray-900 hover:border-gray-400"
                                  }
                                `}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <div className="block text-sm font-medium text-gray-900 mb-2">Quantity</div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                    >
                      <Minus size={16} />
                    </button>

                    <span className="w-12 text-center font-medium text-lg">{quantity}</span>

                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
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
                >
                  {isAddingToCart ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding to Cart...
                    </div>
                  ) : !selectedVariant?.availableForSale ? (
                    "Out of Stock"
                  ) : (
                    `Add to Cart • ${selectedVariant ? formatPrice(selectedVariant.price.amount) : "$0.00"}`
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
