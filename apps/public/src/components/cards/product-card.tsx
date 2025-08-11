"use client";

import { useShopDomain, useShopifyProduct } from "@/hooks/use-shopify-product";
import type { ShopifyProduct } from "@/lib/shopify-client";
import { formatPrice } from "@minimall/core/client";
import { ExternalLink, Heart, ShoppingCart, cn } from "@minimall/ui";
import Image from "next/image";
import { useState, useTransition } from "react";

interface ProductCardProps {
  productId: string;
  variantId?: string | null;
  displayType?: string;
  className?: string;
  shopDomain?: string; // Allow explicit shop domain override
  onAddToCart?: (productId: string, variantId: string) => void;
  onQuickView?: (productId: string) => void;
}

export function ProductCard({
  productId,
  variantId,
  displayType,
  className,
  shopDomain,
  onAddToCart,
  onQuickView,
}: ProductCardProps) {
  // Use the proper hook for fetching product data
  const fallbackShopDomain = useShopDomain();
  const { product, loading, error } = useShopifyProduct(
    productId,
    shopDomain || fallbackShopDomain
  );

  const [imageLoading, setImageLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product) return;

    const selectedVariant = product.variants.find((v) => v.id === variantId) || product.variants[0];
    if (selectedVariant && onAddToCart) {
      startTransition(() => {
        onAddToCart(product.id, selectedVariant.id);
      });
    }
  };

  const handleQuickView = () => {
    if (onQuickView) {
      onQuickView(productId);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const selectedVariant = product?.variants.find((v) => v.id === variantId) || product?.variants[0];
  const hasDiscount =
    selectedVariant?.compareAtPrice &&
    Number.parseFloat(selectedVariant.compareAtPrice.amount) >
      Number.parseFloat(selectedVariant.price.amount);

  if (loading) {
    return (
      <div
        className={cn(
          "aspect-[4/5] bg-muted rounded-lg animate-pulse",
          displayType === "slider" && "flex-none snap-start w-64",
          className
        )}
      >
        <div className="w-full h-3/4 bg-muted-foreground/10 rounded-t-lg" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
          <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || (!loading && !product)) {
    return (
      <div
        className={cn(
          "aspect-[4/5] bg-muted rounded-lg flex items-center justify-center",
          displayType === "slider" && "flex-none snap-start w-64",
          className
        )}
      >
        <div className="text-center p-4">
          <p className="text-muted-foreground text-sm">
            {error ? "Product error" : "Product unavailable"}
          </p>
          {error && (
            <p className="text-xs text-muted-foreground mt-1" title={error}>
              {error.length > 50 ? `${error.substring(0, 50)}...` : error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Type guard: product is definitely not null at this point
  if (!product) {
    return null;
  }

  return (
    <div
      className={cn(
        "group cursor-pointer bg-background rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        displayType === "slider" && "flex-none snap-start w-64",
        className
      )}
      onClick={handleQuickView}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleQuickView();
        }
      }}
    >
      <div className="relative aspect-square">
        {/* Product Image */}
        <Image
          src={product.images[0]?.url || "/placeholder-product.jpg"}
          alt={product.images[0]?.altText || product.title}
          fill
          className={cn(
            "object-cover transition-all duration-300 group-hover:scale-105",
            imageLoading && "opacity-0"
          )}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          onLoad={() => setImageLoading(false)}
          priority={false}
        />

        {imageLoading && <div className="absolute inset-0 bg-muted loading-shimmer" />}

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-2 left-2 z-10">
            <div className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">SALE</div>
          </div>
        )}

        {/* Action Buttons Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex gap-2">
            {/* Add to Cart Button */}
            <button
              type="button"
              className={cn(
                "w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-black transition-all duration-200 hover:bg-white hover:scale-110",
                isPending && "opacity-50 cursor-not-allowed"
              )}
              onClick={handleAddToCart}
              disabled={!selectedVariant?.availableForSale || isPending}
              aria-label="Add to cart"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
            </button>

            {/* Like Button */}
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-black transition-all duration-200 hover:bg-white hover:scale-110"
              onClick={handleLike}
              aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn(
                  "w-5 h-5 transition-colors duration-200",
                  isLiked && "fill-red-500 text-red-500"
                )}
              />
            </button>

            {/* External Link Button */}
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-black transition-all duration-200 hover:bg-white hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/products/${product.handle}`, "_blank", "noopener,noreferrer");
              }}
              aria-label="View product page"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Availability Badge */}
        {!selectedVariant?.availableForSale && (
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <div className="px-2 py-1 bg-black/70 text-white text-xs font-medium rounded text-center">
              OUT OF STOCK
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-medium text-sm line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">
            {formatPrice(Number.parseFloat(selectedVariant?.price.amount || "0") * 100)}
          </span>

          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(Number.parseFloat(selectedVariant?.compareAtPrice?.amount || "0") * 100)}
            </span>
          )}
        </div>

        {/* Variant Title (if not default) */}
        {selectedVariant && selectedVariant.title !== "Default Title" && (
          <p className="text-xs text-muted-foreground truncate">{selectedVariant.title}</p>
        )}
      </div>
    </div>
  );
}
