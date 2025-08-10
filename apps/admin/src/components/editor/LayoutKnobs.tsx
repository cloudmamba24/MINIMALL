"use client";

import { useState } from "react";
import { Slider } from "@minimall/ui/slider";
import { Switch } from "@minimall/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@minimall/ui/select";
import { Button } from "@minimall/ui/button";
import { Badge } from "@minimall/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@minimall/ui/tabs";
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCcw,
  Info
} from "lucide-react";
import { LayoutConfig, AspectRatio, MediaFilter, ASPECT_RATIOS, MEDIA_FILTERS } from "@minimall/core/types";
import { cn } from "../../lib/utils";

interface LayoutKnobsProps {
  layout: LayoutConfig;
  onLayoutChange: (updates: Partial<LayoutConfig>) => void;
  className?: string;
}

export function LayoutKnobs({
  layout,
  onLayoutChange,
  className,
}: LayoutKnobsProps) {
  const [activeDevice, setActiveDevice] = useState<'base' | 'sm' | 'md' | 'lg'>('base');

  // Get the current responsive config for the active device
  const getCurrentConfig = () => {
    if (activeDevice === 'base') {
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
    if (activeDevice === 'base') {
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
    if (activeDevice === 'base') {
      onLayoutChange({
        rows: 2,
        columns: 2,
        gutter: 8,
        outerMargin: 16,
        borderRadius: 8,
        hoverZoom: true,
        aspect: '1:1',
        mediaFilter: 'all',
      });
    } else {
      const newResponsive = { ...layout.responsive };
      delete newResponsive[activeDevice];
      onLayoutChange({ responsive: newResponsive });
    }
  };

  // Check if current device has custom settings
  const hasCustomSettings = () => {
    if (activeDevice === 'base') return false;
    return layout.responsive?.[activeDevice] !== undefined;
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'lg': return <Monitor className="w-4 h-4" />;
      case 'md': return <Tablet className="w-4 h-4" />;
      case 'sm': return <Smartphone className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getDeviceLabel = (device: string) => {
    switch (device) {
      case 'base': return 'Base';
      case 'sm': return 'Mobile';
      case 'md': return 'Tablet';
      case 'lg': return 'Desktop';
      default: return device;
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
          {[
            { id: 'base', label: 'Base' },
            { id: 'sm', label: 'SM' },
            { id: 'md', label: 'MD' },
            { id: 'lg', label: 'LG' },
          ].map((device) => (
            <button
              key={device.id}
              onClick={() => setActiveDevice(device.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-xs font-medium rounded-md transition-colors",
                activeDevice === device.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              {device.id !== 'base' && getDeviceIcon(device.id)}
              <span>{device.label}</span>
              {device.id !== 'base' && hasCustomSettings() && device.id === activeDevice && (
                <Badge variant="secondary" className="h-4 px-1 text-xs">
                  Custom
                </Badge>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rows
            </label>
            <Slider
              value={[currentConfig.rows]}
              onValueChange={([value]) => updateConfig({ rows: value })}
              min={1}
              max={6}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{currentConfig.rows}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Columns
            </label>
            <Slider
              value={[currentConfig.columns]}
              onValueChange={([value]) => updateConfig({ columns: value })}
              min={1}
              max={4}
              step={1}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{currentConfig.columns}</div>
          </div>
        </div>

        {/* Spacing */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gutter
            </label>
            <Slider
              value={[currentConfig.gutter]}
              onValueChange={([value]) => updateConfig({ gutter: value })}
              min={0}
              max={32}
              step={2}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{currentConfig.gutter}px</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Margin
            </label>
            <Slider
              value={[currentConfig.outerMargin]}
              onValueChange={([value]) => updateConfig({ outerMargin: value })}
              min={0}
              max={64}
              step={4}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{currentConfig.outerMargin}px</div>
          </div>
        </div>
      </div>

      {/* Base settings only (not responsive) */}
      {activeDevice === 'base' && (
        <div className="space-y-4">
          {/* Border Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Border Radius
            </label>
            <Slider
              value={[layout.borderRadius]}
              onValueChange={([value]) => onLayoutChange({ borderRadius: value })}
              min={0}
              max={24}
              step={2}
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">{layout.borderRadius}px</div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aspect Ratio
            </label>
            <Select
              value={layout.aspect}
              onValueChange={(value) => onLayoutChange({ aspect: value as AspectRatio })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio} value={ratio}>
                    {ratio === 'auto' ? 'Auto' : ratio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Media Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Filter
            </label>
            <Select
              value={layout.mediaFilter}
              onValueChange={(value) => onLayoutChange({ mediaFilter: value as MediaFilter })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_FILTERS.map((filter) => (
                  <SelectItem key={filter} value={filter}>
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hover Zoom */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Hover Zoom
              </label>
              <p className="text-xs text-gray-500">Scale items on hover</p>
            </div>
            <Switch
              checked={layout.hoverZoom}
              onCheckedChange={(checked) => onLayoutChange({ hoverZoom: checked })}
            />
          </div>
        </div>
      )}

      {/* Info box for responsive settings */}
      {activeDevice !== 'base' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Responsive Override</p>
              <p>
                Settings for {getDeviceLabel(activeDevice)} devices. 
                {hasCustomSettings() 
                  ? ' Custom values will override base settings.' 
                  : ' No custom settings - inheriting from base.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}