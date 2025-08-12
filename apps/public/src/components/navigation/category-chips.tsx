"use client";

import { animationTokens } from "@/lib/animation-tokens";
import { motion } from "framer-motion";

export interface CategoryChipItem {
  id: string;
  label: string;
}

interface CategoryChipsProps {
  items: CategoryChipItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function CategoryChips({ items, activeId, onSelect, className = "" }: CategoryChipsProps) {
  return (
    <div
      className={`w-full overflow-x-auto no-scrollbar ${className}`}
      role="tablist"
      aria-label="Categories"
    >
      <div className="flex gap-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <motion.button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(item.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${isActive ? "bg-white text-black" : "bg-gray-800 text-gray-200 hover:bg-gray-700"}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                duration: animationTokens.duration.fast / 1000,
                ease: animationTokens.easing.entrance,
              }}
            >
              {item.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
