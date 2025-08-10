"use client";

import { useEffect, useState } from "react";

interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string | null;
  renderMode: "instagram-native" | "flexible";
}

export function useMobileDetection(): MobileDetectionResult {
  // Start with neutral state to prevent hydration mismatch
  const [detection, setDetection] = useState<MobileDetectionResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: false, // Don't assume desktop during SSR
    userAgent: null,
    renderMode: "flexible",
  });

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setHasMounted(true);
    const userAgent = navigator.userAgent;

    // Mobile device detection via user agent
    const isMobileUA = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent
    );

    // Viewport-based detection
    const checkViewport = () => {
      const width = window.innerWidth;
      const isMobileViewport = width <= 768;
      const isTabletViewport = width > 768 && width <= 1024;
      const __isDesktopViewport = width > 1024;

      // Combined detection - either mobile UA OR mobile viewport
      const isMobile = isMobileUA || isMobileViewport;
      const isTablet = !isMobile && isTabletViewport;
      const isDesktop = !isMobile && !isTablet;

      // Render mode logic:
      // - Mobile devices (phones): Instagram-native experience
      // - Tablets and desktop: Flexible experience
      const renderMode: "instagram-native" | "flexible" = isMobile
        ? "instagram-native"
        : "flexible";

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        userAgent,
        renderMode,
      });
    };

    // Initial check
    checkViewport();

    // Listen for viewport changes
    const handleResize = () => checkViewport();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Return consistent state during SSR/hydration
  if (!hasMounted) {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: false,
      userAgent: null,
      renderMode: "flexible",
    };
  }

  return detection;
}

// Hook for simple mobile check
export function useIsMobile(): boolean {
  const { isMobile } = useMobileDetection();
  return isMobile;
}

// Hook for render mode
export function useRenderMode(): "instagram-native" | "flexible" {
  const { renderMode } = useMobileDetection();
  return renderMode;
}
