'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { ProductTag as ProductTagType } from '@minimall/core/client';

interface ProductTagProps {
  tag: ProductTagType;
  onTagClick: () => void;
}

export function ProductTag({ tag, onTagClick }: ProductTagProps) {
  const { position, label } = tag;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onTagClick}
      className="absolute group"
      style={{
        left: `${position.x * 100}%`,
        top: `${position.y * 100}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Tag Dot */}
      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
        <Plus className="w-3 h-3 text-black" />
      </div>

      {/* Label Tooltip */}
      {label && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {label}
            {/* Arrow */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        </div>
      )}

      {/* Ripple Effect */}
      <div className="absolute inset-0 rounded-full bg-white opacity-30 animate-ping group-hover:animate-none"></div>
    </motion.button>
  );
}