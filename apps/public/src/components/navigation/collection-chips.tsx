"use client";

import { animationTokens } from "@/lib/animation-tokens";
import { motion } from "framer-motion";

export interface CollectionChipItem {
  id: string;
  label: string;
  imageUrl?: string;
}

interface CollectionChipsProps {
  items: CollectionChipItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function CollectionChips({
  items,
  activeId,
  onSelect,
  className = "",
}: CollectionChipsProps) {
  return (
    <div className={`w-full overflow-x-auto no-scrollbar ${className}`} aria-label="Collections">
      <div className="flex gap-4">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`flex flex-col items-center justify-center w-16 shrink-0 focus:outline-none ${isActive ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                duration: animationTokens.duration.fast / 1000,
                ease: animationTokens.easing.entrance,
              }}
            >
              <div
                className={`w-14 h-14 rounded-full overflow-hidden border ${isActive ? "border-white" : "border-gray-700"}`}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700" />
                )}
              </div>
              <div
                className={`mt-2 text-[10px] uppercase tracking-wide ${isActive ? "text-white" : "text-gray-400"}`}
              >
                {item.label}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
