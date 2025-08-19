"use client";

import type { SiteConfig } from "@minimall/core";

interface VisualEditorProps {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
}

export function VisualEditor({ config, onConfigChange }: VisualEditorProps) {
  // Temporarily disabled while removing Polaris dependencies
  return null;
}
