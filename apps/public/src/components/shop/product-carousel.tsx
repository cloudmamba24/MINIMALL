"use client";

import { animationTokens } from "@/lib/animation-tokens";
import type { Category } from "@minimall/core";
import { motion } from "framer-motion";

interface ProductCarouselProps {
  category: Category;
  onProductClick: (productId: string) => void;
  className?: string;
}

export function ProductCarousel({
  category,
  onProductClick,
  className = "",
}: ProductCarouselProps) {
  const items = category.children || [];
  return (
    <div
      className={`w-full overflow-x-auto snap-x snap-mandatory ${className}`}
      role="region"
      aria-label="Products"
    >
      <div className="flex gap-4 px-1">
        {items.map((child, index) => {
          const [, cardDetails] = child.card;
          const details = cardDetails as any;
          return (
            <motion.button
              key={child.id}
              onClick={() => details.productId && onProductClick(details.productId)}
              className="snap-start shrink-0 w-44 md:w-52 rounded-lg overflow-hidden bg-white text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * (animationTokens.duration.stagger / 1000) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={details.image || details.imageUrl || ""}
                alt={child.title}
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="p-2">
                <div className="text-sm font-semibold text-gray-900 truncate">{child.title}</div>
                {details.price && <div className="text-sm text-gray-600">{details.price}</div>}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
