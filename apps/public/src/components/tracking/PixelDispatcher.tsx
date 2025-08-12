"use client";

import type { PixelSettings } from "@minimall/core";
import { useEffect, useRef } from "react";
import { UTMUtils } from "./UTMTracker";

interface PixelDispatcherProps {
  pixels: PixelSettings;
  configId: string;
}

/**
 * PixelDispatcher - Multi-Platform Analytics Pixel Integration
 *
 * Features:
 * - Facebook Pixel (Meta)
 * - Google Analytics 4
 * - TikTok Pixel
 * - Pinterest Conversion API
 * - Snapchat Pixel
 * - Custom pixels/tags
 * - Event standardization across platforms
 * - UTM attribution integration
 */
export function PixelDispatcher({ pixels, configId }: PixelDispatcherProps) {
  const initialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initialized.current) return;
    initialized.current = true;

    initializePixels(pixels, configId);
  }, [pixels, configId]);

  // This component renders nothing - it's purely for tracking
  return null;
}

/**
 * Initialize all configured pixels
 */
function initializePixels(pixels: PixelSettings, configId: string) {
  if (typeof window === "undefined") return;

  try {
    // Facebook Pixel
    if (pixels.facebook) {
      initializeFacebookPixel(pixels.facebook, configId);
    }

    // Google Analytics 4
    if (pixels.google) {
      initializeGoogleAnalytics(pixels.google, configId);
    }

    // TikTok Pixel
    if (pixels.tiktok) {
      initializeTikTokPixel(pixels.tiktok, configId);
    }

    // Pinterest Conversion API
    if (pixels.pinterest) {
      initializePinterestPixel(pixels.pinterest, configId);
    }

    // Snapchat Pixel
    if (pixels.snapchat) {
      initializeSnapchatPixel(pixels.snapchat, configId);
    }

    // Custom pixels
    if (pixels.custom?.length) {
      pixels.custom.forEach((customPixel) => {
        initializeCustomPixel(customPixel, configId);
      });
    }

    // Set up global event dispatcher
    setupGlobalEventDispatcher(pixels, configId);

    if (process.env.NODE_ENV === "development") {
      console.log("[PixelDispatcher] Initialized pixels for config:", configId);
    }
  } catch (error) {
    console.error("[PixelDispatcher] Failed to initialize pixels:", error);
  }
}

/**
 * Initialize Facebook Pixel
 */
function initializeFacebookPixel(pixelId: string, _configId: string) {
  if ((window as any).fbq) return; // Already initialized

  // Facebook Pixel Code
  const fbq = (_event: string, _data?: any) => {
    (fbq as any).callMethod
      ? (fbq as any).callMethod.apply(fbq, arguments)
      : (fbq as any).queue.push(arguments);
  };
  (fbq as any).push = fbq;
  (fbq as any).loaded = true;
  (fbq as any).version = "2.0";
  (fbq as any).queue = [];
  (window as any).fbq = fbq;

  // Load Facebook Pixel script
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  // Initialize pixel
  (window as any).fbq("init", pixelId);
  (window as any).fbq("track", "PageView");

  if (process.env.NODE_ENV === "development") {
    console.log("[PixelDispatcher] Facebook Pixel initialized:", pixelId);
  }
}

/**
 * Initialize Google Analytics 4
 */
function initializeGoogleAnalytics(measurementId: string, _configId: string) {
  if ((window as any).gtag) return; // Already initialized

  // Google Analytics 4 Code
  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(_type: string, ..._args: any[]) {
    (window as any).dataLayer.push(arguments);
  }
  (window as any).gtag = gtag;

  gtag("js", new Date());
  gtag("config", measurementId, {
    custom_map: {
      custom_parameter_1: "minimall_config_id",
    },
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[PixelDispatcher] Google Analytics initialized:", measurementId);
  }
}

/**
 * Initialize TikTok Pixel
 */
function initializeTikTokPixel(pixelId: string, _configId: string) {
  if ((window as any).ttq) return; // Already initialized

  // TikTok Pixel Code
  const ttq = (_event: string, _data?: any) => {
    (ttq as any).methods = (ttq as any).methods || [];
    (ttq as any).methods.push(arguments);
  };
  (ttq as any).version = "1.1";
  (ttq as any).queue = [];
  (ttq as any).loaded = false;
  (window as any).ttq = ttq;

  // Load TikTok Pixel script
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://analytics.tiktok.com/i18n/pixel/events.js";
  document.head.appendChild(script);

  // Initialize pixel
  (window as any).ttq.load(pixelId);
  (window as any).ttq.page();

  if (process.env.NODE_ENV === "development") {
    console.log("[PixelDispatcher] TikTok Pixel initialized:", pixelId);
  }
}

/**
 * Initialize Pinterest Pixel
 */
function initializePinterestPixel(tagId: string, _configId: string) {
  if ((window as any).pintrk) return; // Already initialized

  // Pinterest Pixel Code
  const pintrk = (_event: string, _data?: any) => {
    (pintrk as any).queue = (pintrk as any).queue || [];
    (pintrk as any).queue.push(Array.prototype.slice.call(arguments));
  };
  (pintrk as any).queue = [];
  (pintrk as any).version = "3.0";
  (window as any).pintrk = pintrk;

  // Load Pinterest Pixel script
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://s.pinimg.com/ct/core.js";
  document.head.appendChild(script);

  // Initialize pixel
  (window as any).pintrk("load", tagId, { em: "<user_email_address>" });
  (window as any).pintrk("page");

  if (process.env.NODE_ENV === "development") {
    console.log("[PixelDispatcher] Pinterest Pixel initialized:", tagId);
  }
}

/**
 * Initialize Snapchat Pixel
 */
function initializeSnapchatPixel(pixelId: string, _configId: string) {
  if ((window as any).snaptr) return; // Already initialized

  // Snapchat Pixel Code
  const snaptr = (_event: string, _data?: any) => {
    (snaptr as any).handleRequest
      ? (snaptr as any).handleRequest.apply(snaptr, arguments)
      : (snaptr as any).queue.push(arguments);
  };
  (snaptr as any).queue = [];
  (window as any).snaptr = snaptr;

  // Load Snapchat Pixel script
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://sc-static.net/scevent.min.js";
  document.head.appendChild(script);

  // Initialize pixel
  (window as any).snaptr("init", pixelId, {});
  (window as any).snaptr("track", "PAGE_VIEW");

  if (process.env.NODE_ENV === "development") {
    console.log("[PixelDispatcher] Snapchat Pixel initialized:", pixelId);
  }
}

/**
 * Initialize custom pixel
 */
function initializeCustomPixel(
  customPixel: { name: string; id: string; type: "script" | "pixel" | "tag" },
  _configId: string
) {
  try {
    if (customPixel.type === "script") {
      // Load custom script
      const script = document.createElement("script");
      script.async = true;
      script.src = customPixel.id; // Assuming id is the script URL
      document.head.appendChild(script);
    }
    // Additional custom pixel types can be added here

    if (process.env.NODE_ENV === "development") {
      console.log("[PixelDispatcher] Custom pixel initialized:", customPixel.name);
    }
  } catch (error) {
    console.error("[PixelDispatcher] Failed to initialize custom pixel:", customPixel.name, error);
  }
}

/**
 * Set up global event dispatcher for standardized events
 */
function setupGlobalEventDispatcher(pixels: PixelSettings, configId: string) {
  // Create global event dispatcher function
  (window as any).__MINIMALL_PIXEL_DISPATCH__ = (eventName: string, eventData: any = {}) => {
    const utmData = UTMUtils.getUTMData(configId);
    const sessionData = UTMUtils.getSessionData(configId);

    // Enhanced event data with UTM and session info
    const enhancedEventData = {
      ...eventData,
      config_id: configId,
      session_id: sessionData?.sessionId,
      utm_source: utmData?.utm?.source,
      utm_medium: utmData?.utm?.medium,
      utm_campaign: utmData?.utm?.campaign,
      utm_term: utmData?.utm?.term,
      utm_content: utmData?.utm?.content,
      device: sessionData?.device,
    };

    // Dispatch to Facebook Pixel
    if (pixels.facebook && (window as any).fbq) {
      try {
        const fbEventName = mapEventToFacebook(eventName);
        (window as any).fbq("track", fbEventName, enhancedEventData);
      } catch (error) {
        console.warn("[PixelDispatcher] Facebook event failed:", error);
      }
    }

    // Dispatch to Google Analytics
    if (pixels.google && (window as any).gtag) {
      try {
        const gaEventName = mapEventToGoogle(eventName);
        (window as any).gtag("event", gaEventName, {
          ...enhancedEventData,
          custom_parameter_1: configId,
        });
      } catch (error) {
        console.warn("[PixelDispatcher] Google Analytics event failed:", error);
      }
    }

    // Dispatch to TikTok Pixel
    if (pixels.tiktok && (window as any).ttq) {
      try {
        const tiktokEventName = mapEventToTikTok(eventName);
        (window as any).ttq.track(tiktokEventName, enhancedEventData);
      } catch (error) {
        console.warn("[PixelDispatcher] TikTok event failed:", error);
      }
    }

    // Dispatch to Pinterest
    if (pixels.pinterest && (window as any).pintrk) {
      try {
        const pinterestEventName = mapEventToPinterest(eventName);
        (window as any).pintrk("track", pinterestEventName, enhancedEventData);
      } catch (error) {
        console.warn("[PixelDispatcher] Pinterest event failed:", error);
      }
    }

    // Dispatch to Snapchat
    if (pixels.snapchat && (window as any).snaptr) {
      try {
        const snapchatEventName = mapEventToSnapchat(eventName);
        (window as any).snaptr("track", snapchatEventName, enhancedEventData);
      } catch (error) {
        console.warn("[PixelDispatcher] Snapchat event failed:", error);
      }
    }

    // Also track in our own analytics
    UTMUtils.trackEvent(configId, eventName, enhancedEventData);
  };
}

/**
 * Event name mapping functions for different platforms
 */
function mapEventToFacebook(eventName: string): string {
  const mapping: Record<string, string> = {
    view_item: "ViewContent",
    add_to_cart: "AddToCart",
    begin_checkout: "InitiateCheckout",
    purchase: "Purchase",
    tile_click: "ViewContent",
    quick_view_open: "ViewContent",
  };
  return mapping[eventName] || "CustomEvent";
}

function mapEventToGoogle(eventName: string): string {
  const mapping: Record<string, string> = {
    view_item: "view_item",
    add_to_cart: "add_to_cart",
    begin_checkout: "begin_checkout",
    purchase: "purchase",
    tile_click: "select_content",
    quick_view_open: "view_item",
  };
  return mapping[eventName] || eventName;
}

function mapEventToTikTok(eventName: string): string {
  const mapping: Record<string, string> = {
    view_item: "ViewContent",
    add_to_cart: "AddToCart",
    begin_checkout: "InitiateCheckout",
    purchase: "CompletePayment",
    tile_click: "ClickButton",
    quick_view_open: "ViewContent",
  };
  return mapping[eventName] || "CustomEvent";
}

function mapEventToPinterest(eventName: string): string {
  const mapping: Record<string, string> = {
    view_item: "pagevisit",
    add_to_cart: "addtocart",
    begin_checkout: "checkout",
    purchase: "checkout",
    tile_click: "custom",
    quick_view_open: "viewcategory",
  };
  return mapping[eventName] || "custom";
}

function mapEventToSnapchat(eventName: string): string {
  const mapping: Record<string, string> = {
    view_item: "VIEW_CONTENT",
    add_to_cart: "ADD_CART",
    begin_checkout: "START_CHECKOUT",
    purchase: "PURCHASE",
    tile_click: "CLICK_CONTENT",
    quick_view_open: "VIEW_CONTENT",
  };
  return mapping[eventName] || "CUSTOM_EVENT";
}

/**
 * Public API for dispatching pixel events
 */
export const PixelUtils = {
  /**
   * Dispatch a standardized event to all configured pixels
   */
  dispatch(eventName: string, eventData: any = {}) {
    if (typeof window !== "undefined" && (window as any).__MINIMALL_PIXEL_DISPATCH__) {
      (window as any).__MINIMALL_PIXEL_DISPATCH__(eventName, eventData);
    }
  },

  /**
   * Track tile click with block attribution
   */
  trackTileClick(_configId: string, blockId: string, categoryId: string, itemId: string) {
    this.dispatch("tile_click", {
      block_id: blockId,
      category_id: categoryId,
      item_id: itemId,
    });
  },

  /**
   * Track quick view open
   */
  trackQuickView(_configId: string, productId: string, blockId?: string) {
    this.dispatch("quick_view_open", {
      product_id: productId,
      block_id: blockId,
    });
  },

  /**
   * Track add to cart with attribution
   */
  trackAddToCart(
    _configId: string,
    productId: string,
    variantId: string,
    quantity: number,
    price: number,
    blockId?: string
  ) {
    this.dispatch("add_to_cart", {
      product_id: productId,
      variant_id: variantId,
      quantity,
      value: price / 100, // Convert cents to dollars
      currency: "USD",
      block_id: blockId,
    });
  },

  /**
   * Track checkout initiation
   */
  trackBeginCheckout(_configId: string, cartValue: number, items: any[]) {
    this.dispatch("begin_checkout", {
      value: cartValue / 100, // Convert cents to dollars
      currency: "USD",
      num_items: items.length,
      items,
    });
  },

  /**
   * Track purchase completion
   */
  trackPurchase(_configId: string, orderId: string, revenue: number, items: any[]) {
    this.dispatch("purchase", {
      transaction_id: orderId,
      value: revenue / 100, // Convert cents to dollars
      currency: "USD",
      items,
    });
  },
};
