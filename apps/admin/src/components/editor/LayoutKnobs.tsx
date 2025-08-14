"use client";

import {
  ASPECT_RATIOS,
  type AspectRatio,
  type LayoutConfig,
  MEDIA_FILTERS,
  type MediaFilter,
} from "@minimall/core";
import { Button, cn } from "@minimall/ui";
import { Info, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";

interface LayoutKnobsProps {
  layout: LayoutConfig;
  onLayoutChange: (updates: Partial<LayoutConfig>) => void;
  className?: string;
}

export function LayoutKnobs({ layout, onLayoutChange, className }: LayoutKnobsProps) {
  const [activeDevice, setActiveDevice] = useState<"base" | "sm" | "md" | "lg">("base");

  // Get the current responsive config for the active device
  const getCurrentConfig = () => {
    if (activeDevice === "base") {
      return {
        rows: layout.rows,
        columns: layout.columns,
        gutter: layout.gutter,
        outerMargin: layout.outerMargin,
      };
    }

    const responsive = layout.responsive?.[activeDevice] || {};
    return {
      rows: responsive.rows ?? layout.rows,
      columns: responsive.columns ?? layout.columns,
      gutter: responsive.gutter ?? layout.gutter,
      outerMargin: responsive.outerMargin ?? layout.outerMargin,
    };
  };

  const currentConfig = getCurrentConfig();

  // Update configuration for the active device
  const updateConfig = (updates: Partial<typeof currentConfig>) => {
    if (activeDevice === "base") {
      onLayoutChange(updates);
    } else {
      const newResponsive = {
        ...layout.responsive,
        [activeDevice]: {
          ...layout.responsive?.[activeDevice],
          ...updates,
        },
      };
      onLayoutChange({ responsive: newResponsive });
    }
  };

  // Reset to default values
  const resetToDefaults = () => {
    if (activeDevice === "base") {
      onLayoutChange({
        rows: 2,
        columns: 2,
        gutter: 8,
        outerMargin: 16,
        borderRadius: 8,
        hoverZoom: true,
        aspect: "1:1",
        mediaFilter: "all",
      });
    } else {
      const newResponsive = { ...layout.responsive };
      delete newResponsive[activeDevice];
      onLayoutChange({ responsive: newResponsive });
    }
  };

  // Check if current device has custom settings
  const hasCustomSettings = () => {
    if (activeDevice === "base") return false;
    return layout.responsive?.[activeDevice] !== undefined;
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "lg":
        return <Monitor className="w-4 h-4" />;
      case "md":
        return <Tablet className="w-4 h-4" />;
      case "sm":
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getDeviceLabel = (device: string) => {
    switch (device) {
      case "base":
        return "Base";
      case "sm":
        return "Mobile";
      case "md":
        return "Tablet";
      case "lg":
        return "Desktop";
      default:
        return device;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Responsive Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Device Settings</h4>
          {hasCustomSettings() && (
            <Button
              onClick={resetToDefaults}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg">
          {(
            [
              { id: "base", label: "Base" },
              { id: "sm", label: "SM" },
              { id: "md", label: "MD" },
              { id: "lg", label: "LG" },
            ] as Array<{ id: "base" | "sm" | "md" | "lg"; label: string }>
          ).map((device) => (
            <button
              key={device.id}
              type="button"
              onClick={() => setActiveDevice(device.id)}
              className={cn(
                "flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-xs font-medium rounded-md transition-colors",
                activeDevice === device.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {device.id !== "base" && getDeviceIcon(device.id)}
              <span>{device.label}</span>
              {device.id !== "base" && hasCustomSettings() && device.id === activeDevice && (
                <span className="bg-gray-100 text-gray-600 px-1 py-0.5 text-xs rounded">
                  Custom
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Controls */}
      <div className="space-y-4">
        {/* Grid Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="layout-rows" className="block text-sm font-medium text-gray-700 mb-2">Rows</label>
            <input
              id="layout-rows"
              type="range"
              value={currentConfig.rows}
              onChange={(e) => updateConfig({ rows: Number.parseInt(e.target.value) })}
              min={1}
              max={6}
              step={1}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">{currentConfig.rows}</div>
          </div>

          <div>
            <label htmlFor="layout-columns" className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
            <input
              id="layout-columns"
              type="range"
              value={currentConfig.columns}
              onChange={(e) => updateConfig({ columns: Number.parseInt(e.target.value) })}
              min={1}
              max={4}
              step={1}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">{currentConfig.columns}</div>
          </div>
        </div>

        {/* Spacing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="layout-gutter" className="block text-sm font-medium text-gray-700 mb-2">Gutter</label>
            <input
              id="layout-gutter"
              type="range"
              value={currentConfig.gutter}
              onChange={(e) => updateConfig({ gutter: Number.parseInt(e.target.value) })}
              min={0}
              max={32}
              step={2}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">{currentConfig.gutter}px</div>
          </div>

          <div>
            <label htmlFor="layout-margin" className="block text-sm font-medium text-gray-700 mb-2">Margin</label>
            <input
              id="layout-margin"
              type="range"
              value={currentConfig.outerMargin}
              onChange={(e) => updateConfig({ outerMargin: Number.parseInt(e.target.value) })}
              min={0}
              max={64}
              step={4}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">{currentConfig.outerMargin}px</div>
          </div>
        </div>
      </div>

      {/* Base settings only (not responsive) */}
      {activeDevice === "base" && (
        <div className="space-y-4">
          {/* Border Radius */}
          <div>
            <label htmlFor="border-radius" className="block text-sm font-medium text-gray-700 mb-2">
              Border Radius
            </label>
            <input
              id="border-radius"
              type="range"
              value={layout.borderRadius}
              onChange={(e) => onLayoutChange({ borderRadius: Number.parseInt(e.target.value) })}
              min={0}
              max={24}
              step={2}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 mt-1">{layout.borderRadius}px</div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-700 mb-2">
              Aspect Ratio
            </label>
            <select
              id="aspect-ratio"
              value={layout.aspect}
              onChange={(e) => onLayoutChange({ aspect: e.target.value as AspectRatio })}
              className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ASPECT_RATIOS.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio === "auto" ? "Auto" : ratio}
                </option>
              ))}
            </select>
          </div>

          {/* Media Filter */}
          <div>
            <label htmlFor="media-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Media Filter
            </label>
            <select
              id="media-filter"
              value={layout.mediaFilter}
              onChange={(e) => onLayoutChange({ mediaFilter: e.target.value as MediaFilter })}
              className="w-full p-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {MEDIA_FILTERS.map((filter) => (
                <option key={filter} value={filter}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Hover Zoom */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="hover-zoom" className="text-sm font-medium text-gray-700">Hover Zoom</label>
              <p className="text-xs text-gray-500">Scale items on hover</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="hover-zoom"
                type="checkbox"
                checked={layout.hoverZoom}
                onChange={(e) => onLayoutChange({ hoverZoom: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>
      )}

      {/* Info box for responsive settings */}
      {activeDevice !== "base" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Responsive Override</p>
              <p>
                Settings for {getDeviceLabel(activeDevice)} devices.
                {hasCustomSettings()
                  ? " Custom values will override base settings."
                  : " No custom settings - inheriting from base."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
