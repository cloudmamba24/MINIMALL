"use client";

import type { Category, LayoutConfig, LayoutPreset, SocialLayoutPreset } from "@minimall/core";
import { Button, Card, cn } from "@minimall/ui";
import {
  ArrowRight,
  Calendar,
  Copy,
  Eye,
  Grid3X3,
  Images,
  LayoutGrid,
  Rocket,
  Save,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { LayoutKnobs } from "./LayoutKnobs";
import { LivePreview } from "./LivePreview";
import { PresetPicker } from "./PresetPicker";
import { TemplateDrawer } from "./TemplateDrawer";

interface EditorPanelProps {
  category: Category;
  onCategoryUpdate: (updatedCategory: Category) => void;
  onSave?: () => void;
  onPublish?: () => void;
  onDuplicate?: () => void;
  onSchedule?: () => void;
  className?: string;
}

export function EditorPanel({
  category,
  onCategoryUpdate,
  onSave,
  onPublish,
  onDuplicate,
  onSchedule,
  className,
}: EditorPanelProps) {
  const [activeTab, setActiveTab] = useState<"layout" | "content" | "templates">("layout");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [_showTemplates, _setShowTemplates] = useState(false);

  // Default layout if none exists
  const defaultLayout: LayoutConfig = {
    preset: "grid",
    rows: 2,
    columns: 2,
    gutter: 8,
    outerMargin: 16,
    borderRadius: 8,
    hoverZoom: true,
    aspect: "1:1",
    mediaFilter: "all",
    blockId: `block_${Math.random().toString(36).substr(2, 9)}`,
  };

  const currentLayout = category.layout || defaultLayout;

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [category]);

  const handleLayoutUpdate = (updatedLayout: Partial<LayoutConfig>) => {
    const newCategory = {
      ...category,
      layout: {
        ...currentLayout,
        ...updatedLayout,
      },
    };
    onCategoryUpdate(newCategory);
  };

  const handlePresetChange = (preset: LayoutPreset | SocialLayoutPreset) => {
    handleLayoutUpdate({ preset: preset as LayoutPreset });
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      setHasUnsavedChanges(false);
    }
  };

  const handlePublish = () => {
    if (onPublish) {
      onPublish();
      setHasUnsavedChanges(false);
    }
  };

  const getPresetIcon = (preset: LayoutPreset | SocialLayoutPreset) => {
    switch (preset) {
      case "grid":
        return <Grid3X3 className="w-4 h-4" />;
      case "masonry":
        return <LayoutGrid className="w-4 h-4" />;
      case "slider":
        return <ArrowRight className="w-4 h-4" />;
      case "stories":
        return <Images className="w-4 h-4" />;
      case "instagram-grid":
        return <Grid3X3 className="w-4 h-4" />;
      case "tiktok-vertical":
        return <ArrowRight className="w-4 h-4" />;
      case "pinterest-masonry":
        return <LayoutGrid className="w-4 h-4" />;
      case "twitter-timeline":
        return <LayoutGrid className="w-4 h-4" />;
      case "stories-horizontal":
        return <Images className="w-4 h-4" />;
      default:
        return <Grid3X3 className="w-4 h-4" />;
    }
  };

  const getItemCount = () => {
    return category.children?.length || 0;
  };

  const getFilteredItemCount = () => {
    if (!category.children) return 0;

    return category.children.filter((item) => {
      if (currentLayout.mediaFilter === "all") return true;

      const cardDetails = item.card[1];
      if (currentLayout.mediaFilter === "photo") {
        return cardDetails.image || cardDetails.imageUrl;
      }
      if (currentLayout.mediaFilter === "video") {
        return cardDetails.videoUrl;
      }
      return true;
    }).length;
  };

  return (
    <div className={cn("flex h-screen bg-gray-50", className)}>
      {/* Left Panel - Controls */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Gallery Editor</h2>
            <div className="flex items-center space-x-2">
              {getPresetIcon(currentLayout.preset)}
              <span
                className={`px-2 py-1 text-xs rounded ${hasUnsavedChanges ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
              >
                {hasUnsavedChanges ? "Unsaved" : "Saved"}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {category.title} • {getFilteredItemCount()} of {getItemCount()} items
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: "layout", label: "Layout", icon: <Settings className="w-4 h-4" /> },
            { id: "templates", label: "Templates", icon: <LayoutGrid className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "layout" | "content" | "templates")}
              className={cn(
                "flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === "layout" && (
            <>
              {/* Preset Picker */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Layout Preset</h3>
                <PresetPicker
                  currentPreset={currentLayout.preset}
                  onPresetChange={handlePresetChange}
                  showSocialPresets={true}
                />
              </div>

              {/* Layout Controls */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Layout Settings</h3>
                <LayoutKnobs layout={currentLayout} onLayoutChange={handleLayoutUpdate} />
              </div>
            </>
          )}

          {activeTab === "templates" && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Gallery Templates</h3>
              <TemplateDrawer
                currentLayout={currentLayout}
                onTemplateApply={(templateLayout) => {
                  handleLayoutUpdate(templateLayout);
                }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className="flex-1"
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => setIsPreviewMode(!isPreviewMode)} variant="outline" size="icon">
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={handlePublish} className="w-full" disabled={!hasUnsavedChanges}>
            <Rocket className="w-4 h-4 mr-2" />
            Publish Changes
          </Button>

          <div className="flex space-x-2">
            <Button onClick={onDuplicate} variant="outline" className="flex-1" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            <Button onClick={onSchedule} variant="outline" className="flex-1" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 bg-gray-100">
        <div className="h-full p-4">
          <Card className="h-full">
            <LivePreview category={category} isPreviewMode={isPreviewMode} className="h-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}
