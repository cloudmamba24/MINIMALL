"use client";

import { cn } from "@minimall/ui";
import { motion } from "framer-motion";
import { 
  Grid3X3, 
  LayoutGrid, 
  ArrowRight, 
  Images,
  Check
} from "lucide-react";
import { LayoutPreset, LAYOUT_PRESETS } from "@minimall/core";

interface PresetPickerProps {
  currentPreset: LayoutPreset;
  onPresetChange: (preset: LayoutPreset) => void;
  className?: string;
}

const PRESET_CONFIG = {
  grid: {
    name: 'Grid',
    description: 'Uniform grid layout with equal-sized tiles',
    icon: <Grid3X3 className="w-6 h-6" />,
    preview: (
      <div className="grid grid-cols-2 gap-1 w-full h-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-blue-200 rounded-sm" />
        ))}
      </div>
    ),
    bestFor: ['Products', 'Photos', 'Equal emphasis'],
  },
  masonry: {
    name: 'Masonry',
    description: 'Pinterest-style staggered layout',
    icon: <LayoutGrid className="w-6 h-6" />,
    preview: (
      <div className="flex flex-col gap-1 w-full h-8">
        <div className="flex gap-1 h-3">
          <div className="bg-green-200 rounded-sm flex-1" />
          <div className="bg-green-200 rounded-sm flex-1" />
        </div>
        <div className="flex gap-1 h-4">
          <div className="bg-green-200 rounded-sm flex-1" />
          <div className="bg-green-200 rounded-sm flex-[0.7]" />
        </div>
      </div>
    ),
    bestFor: ['Mixed content', 'Images', 'Visual variety'],
  },
  slider: {
    name: 'Slider',
    description: 'Horizontal scrolling carousel',
    icon: <ArrowRight className="w-6 h-6" />,
    preview: (
      <div className="flex gap-1 w-full h-8">
        <div className="bg-purple-200 rounded-sm w-4 flex-shrink-0" />
        <div className="bg-purple-200 rounded-sm w-4 flex-shrink-0" />
        <div className="bg-purple-300 rounded-sm w-4 flex-shrink-0" />
        <div className="bg-purple-100 rounded-sm w-2 flex-shrink-0" />
      </div>
    ),
    bestFor: ['Many items', 'Mobile', 'Featured content'],
  },
  stories: {
    name: 'Stories',
    description: 'Full-screen vertical stories format',
    icon: <Images className="w-6 h-6" />,
    preview: (
      <div className="w-full h-8 bg-gradient-to-t from-orange-300 to-orange-100 rounded-sm relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/50 rounded" />
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-white/30 rounded-sm" />
      </div>
    ),
    bestFor: ['Video', 'Immersive', 'Mobile-first'],
  },
} as const;

export function PresetPicker({
  currentPreset,
  onPresetChange,
  className,
}: PresetPickerProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {LAYOUT_PRESETS.map((preset) => {
        const config = PRESET_CONFIG[preset];
        const isSelected = currentPreset === preset;

        return (
          <motion.div
            key={preset}
            className={cn(
              "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
              isSelected
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            )}
            whileHover={{ scale: isSelected ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onPresetChange(preset)}
          >
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}

            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className={cn(
                "p-2 rounded-lg",
                isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
              )}>
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "font-medium",
                  isSelected ? "text-blue-900" : "text-gray-900"
                )}>
                  {config.name}
                </h4>
                <p className={cn(
                  "text-sm mt-1",
                  isSelected ? "text-blue-700" : "text-gray-600"
                )}>
                  {config.description}
                </p>

                {/* Preview */}
                <div className="mt-3 p-2 bg-gray-100 rounded">
                  {config.preview}
                </div>

                {/* Best for tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {config.bestFor.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        isSelected
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}