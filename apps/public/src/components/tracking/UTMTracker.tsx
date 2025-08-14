"use client";

import type { UTMParameters } from "@minimall/core";
import { useEffect, useRef } from "react";
import { createUTMParams } from "../../lib/type-utils";

// Define UTMData type for global window object
interface UTMData {
  configId: string;
  sessionId: string;
  utm: UTMParameters;
  capturedAt: string;
  expiresAt: string;
}

interface UTMTrackerProps {
  configId: string;
}

/**
 * UTMTracker - Persistent UTM Parameter Management
 *
 * Features:
 * - Captures UTM parameters on page entry
 * - Persists UTM data in localStorage for session duration
 * - Provides UTM data to analytics events and cart attributes
 * - Handles fallback for missing parameters
 * - Session-based tracking with configurable expiration
 */
export function UTMTracker({ configId }: UTMTrackerProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initialized.current) return;
    initialized.current = true;

    initializeUTMTracking(configId);
  }, [configId]);

  // This component renders nothing - it's purely for tracking
  return null;
}

/**
 * Initialize UTM tracking system
 */
function initializeUTMTracking(configId: string) {
  try {
    const utmData = captureUTMParameters();
    const sessionData = getOrCreateSession(configId);

    // Store UTM data if we have any parameters
    if (hasUTMData(utmData)) {
      storeUTMData(configId, utmData, sessionData.sessionId);

      if (process.env.NODE_ENV === "development") {
        console.log("[UTMTracker] UTM parameters captured:", utmData);
      }
    } else {
      // Check for existing UTM data in localStorage
      const existingUTM = getStoredUTMData(configId);
      if (existingUTM) {
        if (process.env.NODE_ENV === "development") {
          console.log("[UTMTracker] Using stored UTM parameters:", existingUTM.utm);
        }
      }
    }

    // Track page view with UTM data
    trackPageView(configId);
  } catch (error) {
    console.error("[UTMTracker] Failed to initialize UTM tracking:", error);
  }
}

/**
 * Capture UTM parameters from current URL
 */
function captureUTMParameters(): UTMParameters {
  if (typeof window === "undefined") return {};

  const urlParams = new URLSearchParams(window.location.search);
  return createUTMParams(urlParams);
}

/**
 * Check if UTM data contains any parameters
 */
function hasUTMData(utm: UTMParameters): boolean {
  return !!(utm.source || utm.medium || utm.campaign || utm.term || utm.content);
}

/**
 * Generate or retrieve session data
 */
function getOrCreateSession(configId: string) {
  const sessionKey = `minimall_session_${configId}`;
  const existing = localStorage.getItem(sessionKey);

  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      // Check if session is still valid (24 hours)
      const now = Date.now();
      const sessionAge = now - parsed.createdAt;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (sessionAge < maxAge) {
        return parsed;
      }
    } catch (error) {
      console.warn("[UTMTracker] Failed to parse existing session:", error);
    }
  }

  // Create new session
  const sessionData = {
    sessionId: generateSessionId(),
    configId,
    createdAt: Date.now(),
    device: getDeviceType(),
    userAgent: navigator.userAgent,
    referrer: document.referrer || undefined,
  };

  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
  return sessionData;
}

/**
 * Store UTM data with session information
 */
function storeUTMData(configId: string, utm: UTMParameters, sessionId: string) {
  const utmKey = `minimall_utm_${configId}`;
  const now = new Date().toISOString();
  const utmData: UTMData = {
    configId,
    utm,
    sessionId,
    capturedAt: now,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  };

  localStorage.setItem(utmKey, JSON.stringify(utmData));

  // Also update the global UTM context for immediate use
  if (typeof window !== "undefined") {
    (window as Window & { __MINIMALL_UTM__?: UTMData }).__MINIMALL_UTM__ = utmData;
  }
}

/**
 * Get stored UTM data
 */
function getStoredUTMData(configId: string) {
  try {
    const utmKey = `minimall_utm_${configId}`;
    const stored = localStorage.getItem(utmKey);

    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if UTM data is still valid (7 days)
      const now = Date.now();
      const utmAge = now - parsed.capturedAt;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (utmAge < maxAge) {
        return parsed;
      }
      // Clean up expired UTM data
      localStorage.removeItem(utmKey);
    }
  } catch (error) {
    console.warn("[UTMTracker] Failed to retrieve stored UTM data:", error);
  }

  return null;
}

/**
 * Generate unique session ID
 */
function generateSessionId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Detect device type
 */
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";

  const width = window.innerWidth;

  if (width <= 768) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

/**
 * Track initial page view
 */
function trackPageView(configId: string) {
  const utmData = getStoredUTMData(configId);
  const sessionData = getOrCreateSession(configId);

  // Send page view event to analytics
  const event = {
    event: "page_view",
    configId,
    sessionId: sessionData.sessionId,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    referrer: document.referrer || undefined,
    device: sessionData.device,
    utm: utmData?.utm || {},
  };

  // Send to analytics endpoint (fire and forget)
  fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  }).catch((error) => {
    if (process.env.NODE_ENV === "development") {
      console.warn("[UTMTracker] Failed to send page view event:", error);
    }
  });
}

/**
 * Public API for accessing UTM data from other components
 */
export const UTMUtils = {
  /**
   * Get current UTM data for a config
   */
  getUTMData(configId: string) {
    return getStoredUTMData(configId);
  },

  /**
   * Get current session data
   */
  getSessionData(configId: string) {
    return getOrCreateSession(configId);
  },

  /**
   * Track custom event with UTM attribution
   */
  trackEvent(
    configId: string,
    eventName: string,
    properties: Record<string, string | number | boolean> = {}
  ) {
    const utmData = getStoredUTMData(configId);
    const sessionData = getOrCreateSession(configId);

    const event = {
      event: eventName,
      configId,
      sessionId: sessionData.sessionId,
      timestamp: new Date().toISOString(),
      properties,
      device: sessionData.device,
      utm: utmData?.utm || {},
    };

    // Send to analytics endpoint
    return fetch("/api/analytics/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }).catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("[UTMTracker] Failed to send event:", eventName, error);
      }
    });
  },

  /**
   * Get UTM parameters for cart attributes
   */
  getCartAttributes(configId: string) {
    const utmData = getStoredUTMData(configId);
    const sessionData = getOrCreateSession(configId);

    return {
      minimall_config_id: configId,
      minimall_session_id: sessionData.sessionId,
      minimall_utm_source: utmData?.utm?.source || "",
      minimall_utm_medium: utmData?.utm?.medium || "",
      minimall_utm_campaign: utmData?.utm?.campaign || "",
      minimall_utm_term: utmData?.utm?.term || "",
      minimall_utm_content: utmData?.utm?.content || "",
      minimall_device: sessionData.device,
      minimall_referrer: sessionData.referrer || "",
    };
  },

  /**
   * Clean up expired data
   */
  cleanup(configId: string) {
    try {
      const utmKey = `minimall_utm_${configId}`;
      const sessionKey = `minimall_session_${configId}`;

      localStorage.removeItem(utmKey);
      localStorage.removeItem(sessionKey);

      if (typeof window !== "undefined" && "__MINIMALL_UTM__" in window) {
        delete (window as Window & { __MINIMALL_UTM__?: UTMData }).__MINIMALL_UTM__;
      }
    } catch (error) {
      console.warn("[UTMTracker] Failed to cleanup:", error);
    }
  },
};
