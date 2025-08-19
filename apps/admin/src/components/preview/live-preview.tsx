"use client";

import type { SiteConfig } from "@minimall/core";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  RefreshCw, 
  ExternalLink,
  AlertCircle,
  Loader2
} from "lucide-react";

interface LivePreviewProps {
  config: SiteConfig;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

type ViewportSize = "mobile" | "tablet" | "desktop";

interface ViewportDimensions {
  width: number;
  height: number;
  label: string;
}

const VIEWPORT_SIZES: Record<ViewportSize, ViewportDimensions> = {
  mobile: { width: 375, height: 812, label: "iPhone 13 Pro" },
  tablet: { width: 768, height: 1024, label: "iPad" },
  desktop: { width: 1200, height: 800, label: "Desktop" },
};

export function LivePreview({
  config,
  isLoading = false,
  error = null,
  onRefresh,
}: LivePreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [iframeLoading, setIframeLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout>();

  // Generate preview URL based on config
  useEffect(() => {
    if (config?.id) {
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : window.location.origin.replace(":3001", ":3000"); // Admin is on 3001, public on 3000

      setPreviewUrl(`${baseUrl}/g/${config.id}?preview=true&timestamp=${Date.now()}`);
    }
  }, [config]);

  // Handle iframe load events
  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
    setPreviewError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeLoading(false);
    setPreviewError("Failed to load preview");
  }, []);

  // Send config updates to iframe via postMessage
  useEffect(() => {
    if (!iframeRef.current || !config || iframeLoading) return;

    const iframe = iframeRef.current;
    const targetOrigin = new URL(previewUrl).origin;

    // Clear any existing timeout
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    // Send config with a small delay to ensure iframe is ready
    messageTimeoutRef.current = setTimeout(() => {
      try {
        iframe.contentWindow?.postMessage(
          {
            type: "CONFIG_UPDATE",
            config,
            timestamp: Date.now(),
          },
          targetOrigin
        );
      } catch (error) {
        console.warn("Failed to send message to iframe:", error);
      }
    }, 100);

    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [config, previewUrl, iframeLoading]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const targetOrigin = previewUrl ? new URL(previewUrl).origin : window.location.origin;

      if (event.origin !== targetOrigin) return;

      switch (event.data.type) {
        case "PREVIEW_READY":
          setIframeLoading(false);
          setPreviewError(null);
          break;
        case "PREVIEW_ERROR":
          setIframeLoading(false);
          setPreviewError(event.data.error || "Preview error occurred");
          break;
        case "CONFIG_APPLIED":
          // Config successfully applied in preview iframe
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [previewUrl]);

  const refreshPreview = useCallback(() => {
    if (iframeRef.current && previewUrl) {
      setIframeLoading(true);
      setPreviewError(null);
      iframeRef.current.src = `${previewUrl}&refresh=${Date.now()}`;
    }
    onRefresh?.();
  }, [previewUrl, onRefresh]);

  const openInNewTab = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  }, [previewUrl]);

  const dimensions = VIEWPORT_SIZES[viewport];
  const scale = Math.min(1, (window.innerWidth - 100) / dimensions.width);

  if (!config || !config.id) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Live Preview</h2>
          <p className="text-gray-400">No configuration selected for preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <span className="text-sm text-gray-400">
              {config.id} • {dimensions.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport selector */}
            <div className="flex bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewport("mobile")}
                className={`p-2 rounded-lg transition-all ${
                  viewport === "mobile" 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport("tablet")}
                className={`p-2 rounded-lg transition-all ${
                  viewport === "tablet" 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewport("desktop")}
                className={`p-2 rounded-lg transition-all ${
                  viewport === "desktop" 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={refreshPreview}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">Refresh</span>
              </button>
              <button
                onClick={openInNewTab}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-sm">Open</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {(error || previewError) && (
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-sm text-red-400">{error || previewError}</span>
          </div>
        </div>
      )}

      {/* Preview container */}
      <div className="p-6 bg-black/30">
        <div
          className="relative bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden"
          style={{ minHeight: "400px" }}
        >
          {/* Loading overlay */}
          {(isLoading || iframeLoading) && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  {isLoading ? "Loading configuration..." : "Loading preview..."}
                </p>
              </div>
            </div>
          )}

          {/* Preview iframe */}
          <div
            className="mx-auto bg-white rounded-lg overflow-hidden shadow-2xl"
            style={{
              width: dimensions.width * scale,
              height: dimensions.height * scale,
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "all 0.3s ease",
            }}
          >
            {previewUrl && (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                width={dimensions.width}
                height={dimensions.height}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="border-0"
                title={`Preview of ${config.id}`}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            )}
          </div>

          {/* Preview info overlay */}
          <div className="absolute top-4 right-4 bg-black/75 backdrop-blur text-white px-3 py-2 rounded-lg text-xs font-mono">
            {dimensions.width} × {dimensions.height}
            {scale < 1 && ` (${Math.round(scale * 100)}%)`}
          </div>
        </div>

        {/* Preview tips */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Changes are automatically reflected in the preview. Use the refresh button if updates
            don't appear.
          </p>
        </div>
      </div>
    </div>
  );
}