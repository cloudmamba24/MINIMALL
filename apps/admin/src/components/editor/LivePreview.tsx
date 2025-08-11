"use client";

import type { Category } from "@minimall/core";
import { Button, cn } from "@minimall/ui";
import { ExternalLink, Eye, EyeOff, Monitor, RotateCcw, Smartphone, Tablet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
// TODO: Move LayoutSwitch to a shared package instead of importing from public app
// import { LayoutSwitch } from "../../../public/src/components/renderers/LayoutSwitch";

interface LivePreviewProps {
  category: Category;
  isPreviewMode?: boolean;
  className?: string;
}

type PreviewDevice = "desktop" | "tablet" | "mobile";

const DEVICE_CONFIGS = {
  desktop: {
    name: "Desktop",
    icon: <Monitor className="w-4 h-4" />,
    width: "100%",
    maxWidth: "1200px",
    height: "600px",
    scale: 1,
  },
  tablet: {
    name: "Tablet",
    icon: <Tablet className="w-4 h-4" />,
    width: "768px",
    maxWidth: "768px",
    height: "500px",
    scale: 0.8,
  },
  mobile: {
    name: "Mobile",
    icon: <Smartphone className="w-4 h-4" />,
    width: "375px",
    maxWidth: "375px",
    height: "600px",
    scale: 0.7,
  },
} as const;

export function LivePreview({ category, isPreviewMode = false, className }: LivePreviewProps) {
  const [currentDevice, setCurrentDevice] = useState<PreviewDevice>("desktop");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(!isPreviewMode);
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const deviceConfig = DEVICE_CONFIGS[currentDevice];

  // Force refresh preview
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Handle device change
  const handleDeviceChange = (device: PreviewDevice) => {
    setCurrentDevice(device);
  };

  // Generate preview URL (in real implementation, this would be a preview endpoint)
  const getPreviewUrl = () => {
    return `/g/demo?preview=true&device=${currentDevice}`;
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-100", className)}>
      {/* Preview Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900">Live Preview</h3>
          <span
            className={`px-2 py-1 text-xs rounded ${
              isPreviewMode ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {isPreviewMode ? "Interactive" : "Design Mode"}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Device selector */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {Object.entries(DEVICE_CONFIGS).map(([device, config]) => (
              <button
                key={device}
                onClick={() => handleDeviceChange(device as PreviewDevice)}
                className={cn(
                  "px-3 py-2 text-sm flex items-center space-x-2 transition-colors",
                  currentDevice === device
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                )}
              >
                {config.icon}
                <span className="hidden sm:inline">{config.name}</span>
              </button>
            ))}
          </div>

          {/* Preview controls */}
          <Button variant="outline" size="sm" onClick={() => setShowOverlay(!showOverlay)}>
            {showOverlay ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>

          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RotateCcw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getPreviewUrl(), "_blank")}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex items-center justify-center">
          <div
            className="relative bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300"
            style={{
              width: deviceConfig.width,
              maxWidth: deviceConfig.maxWidth,
              height: deviceConfig.height,
              transform: `scale(${deviceConfig.scale})`,
            }}
          >
            {/* Device Frame (for mobile/tablet) */}
            {currentDevice !== "desktop" && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Mobile/tablet bezel */}
                <div className="absolute inset-0 border-8 border-gray-800 rounded-2xl" />
                {/* Home indicator (mobile) */}
                {currentDevice === "mobile" && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full" />
                )}
              </div>
            )}

            {/* Preview Content */}
            <div
              ref={previewRef}
              className={cn(
                "relative w-full h-full overflow-auto bg-white",
                currentDevice !== "desktop" && "rounded-xl m-2"
              )}
              style={{
                height: currentDevice !== "desktop" ? "calc(100% - 16px)" : "100%",
              }}
            >
              {isPreviewMode ? (
                // Interactive preview using iframe
                <iframe
                  ref={iframeRef}
                  src={getPreviewUrl()}
                  className="w-full h-full border-0"
                  title="Live Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                // Static preview placeholder (TODO: implement proper preview)
                <div className="p-4 h-full">
                  {category.layout ? (
                    <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-gray-500 text-center">
                        <Eye className="h-8 w-8 mx-auto mb-2" />
                        <p>Preview for {category.title}</p>
                        <p className="text-sm">Layout: {category.layout.preset}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <Monitor className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-medium">No Layout Configured</p>
                        <p className="text-sm mt-1">Choose a layout preset to see preview</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Overlay (for non-interactive mode) */}
              {showOverlay && !isPreviewMode && (
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium text-gray-900">
                    Preview Mode - Click tiles to test interactions
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {isRefreshing && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <RotateCcw className="w-5 h-5 animate-spin" />
                    <span>Refreshing preview...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Device info overlay */}
            {currentDevice !== "desktop" && (
              <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {deviceConfig.width} × {Number.parseInt(deviceConfig.height)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Footer */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Device: {deviceConfig.name}</span>
            <span>•</span>
            <span>Scale: {Math.round(deviceConfig.scale * 100)}%</span>
            {category.layout && (
              <>
                <span>•</span>
                <span>Layout: {category.layout.preset}</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {category.children && <span>{category.children.length} items</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
