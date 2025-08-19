"use client";

import type { SiteConfig } from "@minimall/core";

interface InstagramVisualEditorProps {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  onPreview?: () => void;
}

export function InstagramVisualEditor({ config, onConfigChange, onPreview }: InstagramVisualEditorProps) {
  // Temporarily disabled while removing Polaris dependencies
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <p className="text-gray-400">Instagram Visual Editor is being updated...</p>
    </div>
  );
}