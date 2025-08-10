"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@minimall/ui/button";
import { Badge } from "@minimall/ui/badge";
import { Card } from "@minimall/ui/card";
import { 
  Wand2, 
  Grid3X3, 
  LayoutGrid, 
  ArrowRight, 
  Images,
  Check,
  Star,
  Zap,
  Sparkles
} from "lucide-react";
import { LayoutConfig, LayoutTemplate, TemplateCategory } from "@minimall/core/types";
import { cn } from "../../lib/utils";

interface TemplateDrawerProps {
  currentLayout: LayoutConfig;
  onTemplateApply: (templateLayout: Partial<LayoutConfig>) => void;
  className?: string;
}

// Curated template definitions
const GALLERY_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'classic-grid',
    name: 'Classic Grid',
    description: 'Clean, uniform grid perfect for product showcases',
    category: 'classic',
    preview: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=150&fit=crop&crop=center',
    tags: ['products', 'clean', 'organized'],
    layout: {
      preset: 'grid',
      rows: 2,
      columns: 2,
      gutter: 12,
      outerMargin: 20,
      borderRadius: 8,
      hoverZoom: true,
      aspect: '1:1',
      mediaFilter: 'all',
      blockId: '', // Will be set when applied
    },
  },
  {
    id: 'minimal-masonry',
    name: 'Minimal Masonry',
    description: 'Pinterest-style layout for diverse content',
    category: 'minimal',
    preview: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=200&h=150&fit=crop&crop=center',
    tags: ['creative', 'mixed-content', 'visual'],
    layout: {
      preset: 'masonry',
      rows: 3,
      columns: 2,
      gutter: 8,
      outerMargin: 16,
      borderRadius: 12,
      hoverZoom: true,
      aspect: 'auto',
      mediaFilter: 'all',
      blockId: '',
    },
  },
  {
    id: 'mobile-slider',
    name: 'Mobile Slider',
    description: 'Touch-friendly carousel for mobile browsing',
    category: 'ecommerce',
    preview: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=200&h=150&fit=crop&crop=center',
    tags: ['mobile', 'swipe', 'featured'],
    layout: {
      preset: 'slider',
      rows: 1,
      columns: 3,
      gutter: 16,
      outerMargin: 24,
      borderRadius: 16,
      hoverZoom: false,
      aspect: '4:5',
      mediaFilter: 'all',
      blockId: '',
    },
  },
  {
    id: 'video-stories',
    name: 'Video Stories',
    description: 'Full-screen video experience like Instagram Stories',
    category: 'video',
    preview: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=200&h=150&fit=crop&crop=center',
    tags: ['video', 'immersive', 'social'],
    layout: {
      preset: 'stories',
      rows: 1,
      columns: 1,
      gutter: 0,
      outerMargin: 0,
      borderRadius: 20,
      hoverZoom: false,
      aspect: '9:16',
      mediaFilter: 'video',
      blockId: '',
    },
  },
  {
    id: 'fashion-showcase',
    name: 'Fashion Showcase',
    description: 'Elegant layout perfect for fashion and lifestyle brands',
    category: 'classic',
    preview: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=150&fit=crop&crop=center',
    tags: ['fashion', 'elegant', 'luxury'],
    layout: {
      preset: 'grid',
      rows: 3,
      columns: 2,
      gutter: 6,
      outerMargin: 12,
      borderRadius: 4,
      hoverZoom: true,
      aspect: '4:5',
      mediaFilter: 'photo',
      blockId: '',
    },
  },
  {
    id: 'tech-gallery',
    name: 'Tech Gallery',
    description: 'Modern layout for tech and gadget showcases',
    category: 'ecommerce',
    preview: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=150&fit=crop&crop=center',
    tags: ['tech', 'modern', 'products'],
    layout: {
      preset: 'masonry',
      rows: 2,
      columns: 3,
      gutter: 10,
      outerMargin: 18,
      borderRadius: 6,
      hoverZoom: true,
      aspect: '1:1',
      mediaFilter: 'all',
      blockId: '',
    },
  },
];

const CATEGORY_CONFIG = {
  classic: {
    name: 'Classic',
    icon: <Grid3X3 className="w-4 h-4" />,
    color: 'blue',
    description: 'Timeless layouts that work for any brand',
  },
  minimal: {
    name: 'Minimal',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'gray',
    description: 'Clean, minimal designs with maximum impact',
  },
  video: {
    name: 'Video-First',
    icon: <Images className="w-4 h-4" />,
    color: 'purple',
    description: 'Optimized for video content and stories',
  },
  ecommerce: {
    name: 'E-commerce',
    icon: <Zap className="w-4 h-4" />,
    color: 'green',
    description: 'Conversion-focused layouts for online stores',
  },
} as const;

export function TemplateDrawer({ currentLayout, onTemplateApply, className }: TemplateDrawerProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const filteredTemplates = selectedCategory === 'all' 
    ? GALLERY_TEMPLATES 
    : GALLERY_TEMPLATES.filter(template => template.category === selectedCategory);

  const handleApplyTemplate = (template: LayoutTemplate) => {
    // Generate new block ID for the template
    const templateLayout = {
      ...template.layout,
      blockId: `block_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    onTemplateApply(templateLayout);
  };

  const isCurrentTemplate = (template: LayoutTemplate) => {
    return template.layout.preset === currentLayout.preset &&
           template.layout.rows === currentLayout.rows &&
           template.layout.columns === currentLayout.columns;
  };

  const getPresetIcon = (preset: string) => {
    switch (preset) {
      case 'grid': return <Grid3X3 className="w-4 h-4" />;
      case 'masonry': return <LayoutGrid className="w-4 h-4" />;
      case 'slider': return <ArrowRight className="w-4 h-4" />;
      case 'stories': return <Images className="w-4 h-4" />;
      default: return <Grid3X3 className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory('all')}
          className="h-8"
        >
          <Star className="w-3 h-3 mr-1" />
          All Templates
        </Button>
        
        {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category as TemplateCategory)}
            className="h-8"
          >
            {config.icon}
            <span className="ml-1">{config.name}</span>
          </Button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid gap-4">
        <AnimatePresence mode="wait">
          {filteredTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={cn(
                  "relative p-4 cursor-pointer transition-all hover:shadow-lg",
                  isCurrentTemplate(template) ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                )}
                onMouseEnter={() => setHoveredTemplate(template.id)}
                onMouseLeave={() => setHoveredTemplate(null)}
                onClick={() => handleApplyTemplate(template)}
              >
                {/* Current template indicator */}
                {isCurrentTemplate(template) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  {/* Preview */}
                  <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      {getPresetIcon(template.layout.preset)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {template.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {template.layout.preset}
                      </Badge>
                      {CATEGORY_CONFIG[template.category] && (
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_CONFIG[template.category].name}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Template specs */}
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span>{template.layout.rows}×{template.layout.columns}</span>
                      <span>•</span>
                      <span>{template.layout.aspect}</span>
                      <span>•</span>
                      <span>{template.layout.gutter}px gap</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <AnimatePresence>
                  {hoveredTemplate === template.id && !isCurrentTemplate(template) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-blue-500/10 rounded-lg flex items-center justify-center"
                    >
                      <Button size="sm" className="bg-white hover:bg-gray-50">
                        <Wand2 className="w-4 h-4 mr-2" />
                        Apply Template
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Images className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No templates found in this category</p>
        </div>
      )}

      {/* Template info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <div className="flex items-start space-x-2">
          <Wand2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-900">Template Tips</p>
            <p className="text-blue-700 mt-1">
              Templates provide a starting point for your gallery design. 
              You can customize any aspect after applying a template.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}