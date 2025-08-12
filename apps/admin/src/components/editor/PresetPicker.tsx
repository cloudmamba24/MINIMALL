"use client";

import {
  LAYOUT_PRESETS,
  type LayoutPreset,
  SOCIAL_LAYOUT_PRESETS,
  type SocialLayoutPreset,
} from "@minimall/core";
import { cn } from "@minimall/ui";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Grid3X3,
  Hash,
  Images,
  Instagram,
  LayoutGrid,
  Music,
  Play,
  Twitter,
} from "lucide-react";

interface PresetPickerProps {
  currentPreset: LayoutPreset | SocialLayoutPreset;
  onPresetChange: (preset: LayoutPreset | SocialLayoutPreset) => void;
  className?: string;
  showSocialPresets?: boolean;
}

const PRESET_CONFIG = {
  grid: {
    name: "Grid",
    description: "Uniform grid layout with equal-sized tiles",
    icon: <Grid3X3 className="w-6 h-6" />,
    preview: (
      <div className="grid grid-cols-2 gap-1 w-full h-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-blue-200 rounded-sm" />
        ))}
      </div>
    ),
    bestFor: ["Products", "Photos", "Equal emphasis"],
  },
  masonry: {
    name: "Masonry",
    description: "Pinterest-style staggered layout",
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
    bestFor: ["Mixed content", "Images", "Visual variety"],
  },
  slider: {
    name: "Slider",
    description: "Horizontal scrolling carousel",
    icon: <ArrowRight className="w-6 h-6" />,
    preview: (
      <div className="flex gap-1 w-full h-8">
        <div className="bg-purple-200 rounded-sm w-4 flex-shrink-0" />
        <div className="bg-purple-200 rounded-sm w-4 flex-shrink-0" />
        <div className="bg-purple-300 rounded-sm w-4 flex-shrink-0" />
        <div className="bg-purple-100 rounded-sm w-2 flex-shrink-0" />
      </div>
    ),
    bestFor: ["Many items", "Mobile", "Featured content"],
  },
  stories: {
    name: "Stories",
    description: "Full-screen vertical stories format",
    icon: <Images className="w-6 h-6" />,
    preview: (
      <div className="w-full h-8 bg-gradient-to-t from-orange-300 to-orange-100 rounded-sm relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/50 rounded" />
        <div className="absolute bottom-1 left-1 right-1 h-1 bg-white/30 rounded-sm" />
      </div>
    ),
    bestFor: ["Video", "Immersive", "Mobile-first"],
  },
} as const;

const SOCIAL_PRESET_CONFIG = {
  "instagram-grid": {
    name: "Instagram Grid",
    description: "Classic Instagram 3x3 grid with square posts",
    icon: <Instagram className="w-6 h-6" />,
    preview: (
      <div className="grid grid-cols-3 gap-0.5 w-full h-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-purple-400 to-pink-400 rounded-sm aspect-square"
          />
        ))}
      </div>
    ),
    bestFor: ["Instagram posts", "Square content", "Social proof"],
  },
  "tiktok-vertical": {
    name: "TikTok Feed",
    description: "Vertical scrolling video feed like TikTok",
    icon: <Music className="w-6 h-6" />,
    preview: (
      <div className="flex flex-col gap-0.5 w-full h-8">
        <div className="bg-gradient-to-r from-red-400 to-red-600 rounded aspect-[9/16] flex items-center justify-center">
          <Play className="w-2 h-2 text-white" />
        </div>
      </div>
    ),
    bestFor: ["TikTok videos", "Vertical content", "Mobile-first"],
  },
  "pinterest-masonry": {
    name: "Pinterest Masonry",
    description: "Pinterest-style mixed media feed",
    icon: <Hash className="w-6 h-6" />,
    preview: (
      <div className="flex flex-col gap-0.5 w-full h-8">
        <div className="flex gap-0.5 h-3">
          <div className="bg-red-300 rounded-sm flex-1" />
          <div className="bg-red-400 rounded-sm flex-1" />
        </div>
        <div className="flex gap-0.5 h-4">
          <div className="bg-red-400 rounded-sm flex-[0.7]" />
          <div className="bg-red-300 rounded-sm flex-1" />
        </div>
      </div>
    ),
    bestFor: ["Mixed social posts", "Visual variety", "Engagement"],
  },
  "twitter-timeline": {
    name: "Twitter Timeline",
    description: "Twitter-style chronological feed",
    icon: <Twitter className="w-6 h-6" />,
    preview: (
      <div className="flex flex-col gap-0.5 w-full h-8">
        <div className="bg-blue-200 rounded h-2" />
        <div className="bg-blue-300 rounded h-1.5" />
        <div className="bg-blue-200 rounded h-2.5" />
        <div className="bg-blue-300 rounded h-1" />
      </div>
    ),
    bestFor: ["Twitter posts", "Text content", "Timeline view"],
  },
  "stories-horizontal": {
    name: "Stories Feed",
    description: "Horizontal Instagram Stories style",
    icon: <Images className="w-6 h-6" />,
    preview: (
      <div className="flex gap-0.5 w-full h-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-gradient-to-t from-orange-400 to-yellow-300 rounded-full w-6 h-6 border-2 border-white flex-shrink-0"
          />
        ))}
      </div>
    ),
    bestFor: ["Instagram Stories", "Highlights", "Preview mode"],
  },
} as const;

export function PresetPicker({
  currentPreset,
  onPresetChange,
  className,
  showSocialPresets = false,
}: PresetPickerProps) {
  const _allPresets = showSocialPresets
    ? [...LAYOUT_PRESETS, ...SOCIAL_LAYOUT_PRESETS]
    : LAYOUT_PRESETS;

  const getPresetConfig = (preset: LayoutPreset | SocialLayoutPreset) => {
    if (LAYOUT_PRESETS.includes(preset as LayoutPreset)) {
      return PRESET_CONFIG[preset as LayoutPreset];
    }
    return SOCIAL_PRESET_CONFIG[preset as SocialLayoutPreset];
  };

  const renderPreset = (preset: LayoutPreset | SocialLayoutPreset) => {
    const config = getPresetConfig(preset);
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
          <div
            className={cn(
              "p-2 rounded-lg",
              isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
            )}
          >
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={cn("font-medium", isSelected ? "text-blue-900" : "text-gray-900")}>
              {config.name}
            </h4>
            <p className={cn("text-sm mt-1", isSelected ? "text-blue-700" : "text-gray-600")}>
              {config.description}
            </p>

            {/* Preview */}
            <div className="mt-3 p-2 bg-gray-100 rounded">{config.preview}</div>

            {/* Best for tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {config.bestFor.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full",
                    isSelected ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
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
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Social Media Presets */}
      {showSocialPresets && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Social Media Layouts</h3>
          <div className="space-y-3">{SOCIAL_LAYOUT_PRESETS.map(renderPreset)}</div>
        </div>
      )}

      {/* Standard Presets */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Standard Layouts</h3>
        <div className="space-y-3">{LAYOUT_PRESETS.map(renderPreset)}</div>
      </div>
    </div>
  );
}
