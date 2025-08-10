"use client";

import type { Theme } from "@minimall/core/client";
import { useEffect, useState } from "react";

interface ThemeProviderProps {
  theme: Theme;
  children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  useEffect(() => {
    // Skip during SSR
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Apply CSS custom properties to the document root
    const root = document.documentElement;

    // Convert hex to HSL for better CSS variable integration
    const hexToHsl = (hex: string) => {
      const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
      const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
      const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Apply theme colors
    root.style.setProperty("--primary", hexToHsl(theme.primaryColor));
    root.style.setProperty("--background", hexToHsl(theme.backgroundColor));

    if (theme.textColor) {
      root.style.setProperty("--foreground", hexToHsl(theme.textColor));
    }

    if (theme.accentColor) {
      root.style.setProperty("--accent", hexToHsl(theme.accentColor));
    }

    // Apply font family
    if (theme.fontFamily) {
      root.style.setProperty("--font-family", theme.fontFamily);
      document.body.style.fontFamily = "var(--font-family), system-ui, -apple-system, sans-serif";
    }

    // Apply border radius
    if (theme.borderRadius) {
      const radiusMap = {
        none: "0px",
        sm: "0.125rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      };

      const radiusValue = radiusMap[theme.borderRadius] || radiusMap.md;
      root.style.setProperty("--radius", radiusValue);
    }

    // Cleanup function to reset styles when component unmounts
    return () => {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--background");
      root.style.removeProperty("--foreground");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--font-family");
      root.style.removeProperty("--radius");
      document.body.style.removeProperty("font-family");
    };
  }, [theme]);

  return (
    <div
      style={
        {
          "--theme-primary": theme.primaryColor,
          "--theme-background": theme.backgroundColor,
          "--theme-text": theme.textColor || "#333333",
          "--theme-accent": theme.accentColor || theme.primaryColor,
        } as React.CSSProperties
      }
      className="theme-provider"
    >
      {children}
    </div>
  );
}

// Hook to use theme values in components
export function useTheme() {
  const [theme, setTheme] = useState<{
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const updateTheme = () => {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);

      setTheme({
        primaryColor: computedStyle.getPropertyValue("--theme-primary"),
        backgroundColor: computedStyle.getPropertyValue("--theme-background"),
        textColor: computedStyle.getPropertyValue("--theme-text"),
        accentColor: computedStyle.getPropertyValue("--theme-accent"),
      });
    };

    updateTheme();

    // Listen for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
