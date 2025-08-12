"use client";

import { animationTokens } from "@/lib/animation-tokens";
import type { Category } from "@minimall/core";
import { motion } from "framer-motion";

interface ImageGridProps {
  category: Category;
  onTileClick?: (id: string) => void;
  className?: string;
}

export function ImageGrid({ category, onTileClick, className = "" }: ImageGridProps) {
  const items = category.children || [];
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {items.map((child, index) => {
        const [, cardDetails] = child.card;
        const details = cardDetails as any;
        return (
          <motion.button
            key={child.id}
            onClick={() => onTileClick?.(child.id)}
            className="relative w-full overflow-hidden rounded-lg bg-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * (animationTokens.duration.stagger / 1000),
              duration: animationTokens.duration.normal / 1000,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={details.image || details.imageUrl || ""}
              alt={child.title}
              className="w-full h-auto object-cover"
            />
          </motion.button>
        );
      })}
    </div>
  );
}
