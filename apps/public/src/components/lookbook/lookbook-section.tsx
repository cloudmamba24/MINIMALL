"use client";

import { type Category } from "@minimall/core";
import { motion } from "framer-motion";
import { animationTokens } from "@/lib/animation-tokens";

interface LookbookSectionProps {
  category: Category;
  onHotspotClick?: (productId: string) => void;
}

export function LookbookSection({ category, onHotspotClick }: LookbookSectionProps) {
  const items = category.children || [];
  return (
    <section className="my-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((child, index) => {
          const [, cardDetails] = child.card;
          const details = cardDetails as any;
          const tags = (details.productTags || []) as Array<{ productId: string; position: { x: number; y: number } }>;
          return (
            <motion.div
              key={child.id}
              className="relative rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * (animationTokens.duration.stagger / 1000) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={details.image || details.imageUrl || ""} alt={child.title} className="w-full h-auto object-cover" />

              {tags.map((tag, i) => (
                <button
                  key={`${child.id}-tag-${i}`}
                  type="button"
                  onClick={() => onHotspotClick?.(tag.productId)}
                  className="absolute w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow-md"
                  style={{ left: `${tag.position.x * 100}%`, top: `${tag.position.y * 100}%`, transform: "translate(-50%, -50%)" }}
                  aria-label="Shop this product"
                >
                  •
                </button>
              ))}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}


