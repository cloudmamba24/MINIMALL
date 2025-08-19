"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Palette,
  Type,
  Layout,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Tablet,
  Square,
  Circle,
  Save,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Grid,
  Maximize,
  Minimize
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
// TODO: Import from @minimall/core once types are properly exported
type Theme = any;

interface ThemeCustomizerProps {
  currentTheme: Theme;
  onSave: (theme: Theme) => Promise<void>;
  onPreview: (theme: Theme) => void;
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: Theme;
  thumbnail: string;
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean and simple",
    theme: {
      primaryColor: "#000000",
      backgroundColor: "#FFFFFF",
      textColor: "#000000",
      accentColor: "#8B5CF6",
      fontFamily: "Inter",
      borderRadius: "md"
    },
    thumbnail: "linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)"
  },
  {
    id: "dark",
    name: "Dark Mode",
    description: "Elegant dark theme",
    theme: {
      primaryColor: "#FFFFFF",
      backgroundColor: "#000000",
      textColor: "#FFFFFF",
      accentColor: "#EC4899",
      fontFamily: "Inter",
      borderRadius: "lg"
    },
    thumbnail: "linear-gradient(135deg, #000000 0%, #1F2937 100%)"
  },
  {
    id: "vibrant",
    name: "Vibrant",
    description: "Bold and colorful",
    theme: {
      primaryColor: "#8B5CF6",
      backgroundColor: "#FEF3C7",
      textColor: "#1F2937",
      accentColor: "#EC4899",
      fontFamily: "Helvetica",
      borderRadius: "xl"
    },
    thumbnail: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)"
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Calm blue tones",
    theme: {
      primaryColor: "#0EA5E9",
      backgroundColor: "#F0F9FF",
      textColor: "#0C4A6E",
      accentColor: "#06B6D4",
      fontFamily: "system-ui",
      borderRadius: "lg"
    },
    thumbnail: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)"
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm gradient vibes",
    theme: {
      primaryColor: "#F97316",
      backgroundColor: "#FFF7ED",
      textColor: "#7C2D12",
      accentColor: "#FB923C",
      fontFamily: "Inter",
      borderRadius: "md"
    },
    thumbnail: "linear-gradient(135deg, #F97316 0%, #FB923C 100%)"
  }
];

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", preview: "The quick brown fox" },
  { value: "Helvetica", label: "Helvetica", preview: "The quick brown fox" },
  { value: "system-ui", label: "System UI", preview: "The quick brown fox" },
  { value: "Georgia", label: "Georgia (Serif)", preview: "The quick brown fox" },
  { value: "Menlo", label: "Menlo (Mono)", preview: "The quick brown fox" }
];

const RADIUS_OPTIONS = [
  { value: "none", label: "None", preview: "0px" },
  { value: "sm", label: "Small", preview: "4px" },
  { value: "md", label: "Medium", preview: "8px" },
  { value: "lg", label: "Large", preview: "12px" },
  { value: "xl", label: "Extra Large", preview: "16px" }
];

export function ThemeCustomizer({
  currentTheme,
  onSave,
  onPreview
}: ThemeCustomizerProps) {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"presets" | "colors" | "typography" | "layout">("presets");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(theme) !== JSON.stringify(currentTheme));
  }, [theme, currentTheme]);

  // Live preview
  useEffect(() => {
    onPreview(theme);
  }, [theme, onPreview]);

  // Apply preset
  const handleApplyPreset = useCallback((preset: ThemePreset) => {
    setTheme(preset.theme);
    setSelectedPreset(preset.id);
  }, []);

  // Reset to original
  const handleReset = useCallback(() => {
    setTheme(currentTheme);
    setSelectedPreset(null);
  }, [currentTheme]);

  // Copy color to clipboard
  const handleCopyColor = useCallback(async (color: string) => {
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  }, []);

  // Save theme
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(theme);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Theme Customizer</h2>
          <p className="text-sm text-gray-500 mt-1">
            Customize your site's appearance
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(["presets", "colors", "typography", "layout"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Presets Tab */}
          {activeTab === "presets" && (
            <div className="space-y-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    selectedPreset === preset.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex-shrink-0"
                      style={{ background: preset.thumbnail }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{preset.name}</p>
                      <p className="text-sm text-gray-500">{preset.description}</p>
                    </div>
                    {selectedPreset === preset.id && (
                      <Check className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Colors Tab */}
          {activeTab === "colors" && (
            <div className="space-y-4">
              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-24 px-2 py-2 border rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopyColor(theme.primaryColor)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {copiedColor === theme.primaryColor ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Background Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="color"
                      value={theme.backgroundColor}
                      onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="w-24 px-2 py-2 border rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopyColor(theme.backgroundColor)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {copiedColor === theme.backgroundColor ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Text Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="color"
                      value={theme.textColor || "#000000"}
                      onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={theme.textColor || "#000000"}
                    onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                    className="w-24 px-2 py-2 border rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopyColor(theme.textColor || "#000000")}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {copiedColor === theme.textColor ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="color"
                      value={theme.accentColor || "#8B5CF6"}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={theme.accentColor || "#8B5CF6"}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    className="w-24 px-2 py-2 border rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => handleCopyColor(theme.accentColor || "#8B5CF6")}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {copiedColor === theme.accentColor ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Color Palette Suggestions */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Quick Palettes
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Monochrome", colors: ["#000000", "#FFFFFF", "#6B7280", "#9333EA"] },
                    { name: "Pastel", colors: ["#FEE2E2", "#DBEAFE", "#F3E8FF", "#D1FAE5"] },
                    { name: "Neon", colors: ["#00FF00", "#FF00FF", "#00FFFF", "#FFFF00"] },
                    { name: "Earth", colors: ["#8B4513", "#228B22", "#D2691E", "#F4A460"] },
                  ].map((palette) => (
                    <button
                      key={palette.name}
                      className="p-2 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex gap-1 mb-1">
                        {palette.colors.map((color) => (
                          <div
                            key={color}
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600">{palette.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Typography Tab */}
          {activeTab === "typography" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <div className="space-y-2">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setTheme({ ...theme, fontFamily: font.value })}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        theme.fontFamily === font.value
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="font-medium text-gray-900">{font.label}</p>
                      <p
                        className="text-sm text-gray-500 mt-1"
                        style={{ fontFamily: font.value }}
                      >
                        {font.preview}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Layout Tab */}
          {activeTab === "layout" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border Radius
                </label>
                <div className="space-y-2">
                  {RADIUS_OPTIONS.map((radius) => (
                    <button
                      key={radius.value}
                      onClick={() => setTheme({ ...theme, borderRadius: radius.value as any })}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        theme.borderRadius === radius.value
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{radius.label}</p>
                          <p className="text-sm text-gray-500">{radius.preview}</p>
                        </div>
                        <div className="flex gap-2">
                          <div
                            className="w-10 h-10 bg-gray-300"
                            style={{
                              borderRadius: radius.value === "none" ? "0" :
                                radius.value === "sm" ? "4px" :
                                radius.value === "md" ? "8px" :
                                radius.value === "lg" ? "12px" : "16px"
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grid Density
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["compact", "regular", "spacious"].map((density) => (
                    <button
                      key={density}
                      className="p-3 border-2 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      <Grid className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs capitalize">{density}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={!hasChanges}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Preview Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Live Preview</h3>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`p-2 rounded ${
                  previewDevice === "mobile" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("tablet")}
                className={`p-2 rounded ${
                  previewDevice === "tablet" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`p-2 rounded ${
                  previewDevice === "desktop" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
          <div
            className={`bg-white shadow-2xl transition-all ${
              previewDevice === "mobile" ? "w-[375px]" :
              previewDevice === "tablet" ? "w-[768px]" :
              "w-full max-w-[1200px]"
            }`}
            style={{
              backgroundColor: theme.backgroundColor,
              color: theme.textColor || "#000000",
              fontFamily: theme.fontFamily || "Inter"
            }}
          >
            {/* Preview Header */}
            <div
              className="p-4 border-b"
              style={{ borderColor: theme.textColor ? `${theme.textColor}20` : "#00000020" }}
            >
              <h1
                className="text-2xl font-bold"
                style={{ color: theme.primaryColor }}
              >
                Your Brand
              </h1>
              <p className="text-sm mt-1 opacity-70">
                @yourusername
              </p>
            </div>

            {/* Preview Grid */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="aspect-square"
                    style={{
                      backgroundColor: i % 2 === 0 ? theme.accentColor : theme.primaryColor,
                      borderRadius: theme.borderRadius === "none" ? "0" :
                        theme.borderRadius === "sm" ? "4px" :
                        theme.borderRadius === "md" ? "8px" :
                        theme.borderRadius === "lg" ? "12px" : "16px"
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Preview Button */}
            <div className="p-4">
              <button
                className="w-full py-3 font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: theme.accentColor || theme.primaryColor,
                  color: theme.backgroundColor,
                  borderRadius: theme.borderRadius === "none" ? "0" :
                    theme.borderRadius === "sm" ? "4px" :
                    theme.borderRadius === "md" ? "8px" :
                    theme.borderRadius === "lg" ? "12px" : "16px"
                }}
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}