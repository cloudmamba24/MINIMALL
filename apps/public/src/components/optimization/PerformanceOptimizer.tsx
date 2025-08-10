"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Virtual List Component for Large Gallery Rendering
 */
interface VirtualListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => ReactNode;
  overscan?: number;
}

export function VirtualList({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3
}: VirtualListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const visibleStartWithOverscan = Math.max(visibleStart - overscan, 0);
  const visibleEndWithOverscan = Math.min(visibleEnd + overscan, items.length - 1);

  const visibleItems = items.slice(visibleStartWithOverscan, visibleEndWithOverscan + 1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={scrollElementRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleStartWithOverscan * itemHeight}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={visibleStartWithOverscan + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleStartWithOverscan + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy Image Component with Intersection Observer
 */
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f0f0f0'/%3E%3C/svg%3E",
  onLoad,
  priority = false
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <div className={className} ref={imgRef}>
      {isInView && (
        <>
          <img
            src={src}
            alt={alt}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            loading={priority ? 'eager' : 'lazy'}
          />
          {!isLoaded && (
            <img
              src={placeholder}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-100"
            />
          )}
        </>
      )}
      {!isInView && (
        <img
          src={placeholder}
          alt=""
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

/**
 * Image Preloader for Next/Previous Items
 */
export function useImagePreloader(images: string[], currentIndex: number) {
  useEffect(() => {
    const preloadImage = (src: string) => {
      const img = new Image();
      img.src = src;
    };

    // Preload next and previous images
    const nextIndex = currentIndex + 1;
    const prevIndex = currentIndex - 1;

    if (nextIndex < images.length && images[nextIndex]) {
      preloadImage(images[nextIndex]);
    }
    if (prevIndex >= 0 && images[prevIndex]) {
      preloadImage(images[prevIndex]);
    }
  }, [images, currentIndex]);
}

/**
 * Touch-Optimized Button Component
 */
interface TouchButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

export function TouchButton({
  children,
  onClick,
  className = "",
  disabled = false,
  hapticFeedback = true
}: TouchButtonProps) {
  const handleClick = () => {
    if (disabled) return;

    // Haptic feedback on supported devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    onClick();
  };

  return (
    <motion.button
      className={`touch-manipulation select-none ${className}`}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      transition={{ duration: 0.1 }}
      style={{
        minHeight: '44px', // iOS recommended touch target size
        minWidth: '44px',
      }}
    >
      {children}
    </motion.button>
  );
}

/**
 * Debounced Scroll Handler
 */
export function useDebounceScroll(callback: (scrollY: number) => void, delay: number = 100) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(window.scrollY);
      }, delay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay]);
}

/**
 * Viewport Detection Hook
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...viewport,
    isMobile: viewport.width <= 768,
    isTablet: viewport.width > 768 && viewport.width <= 1024,
    isDesktop: viewport.width > 1024,
  };
}

/**
 * Optimized Image Sizes Calculator
 */
export function calculateImageSizes(containerWidth: number, columns: number): string {
  const gutter = 8; // Typical gutter size
  const margin = 16; // Typical margin
  
  const availableWidth = containerWidth - (margin * 2) - (gutter * (columns - 1));
  const itemWidth = Math.floor(availableWidth / columns);
  
  // Generate responsive sizes attribute
  return [
    `(max-width: 640px) ${Math.min(itemWidth, containerWidth)}px`,
    `(max-width: 768px) ${Math.min(itemWidth * 1.2, containerWidth)}px`,
    `(max-width: 1024px) ${Math.min(itemWidth * 1.5, containerWidth)}px`,
    `${itemWidth}px`
  ].join(', ');
}

/**
 * Performance Monitor Hook (Development only)
 */
export function usePerformanceMonitor(configId: string) {
  const metricsRef = useRef<{
    lcp?: number;
    fid?: number;
    cls?: number;
    ttfb?: number;
  }>({});

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metricsRef.current.lcp = lastEntry.startTime;
        console.log(`[Performance] LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      }
    });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        metricsRef.current.fid = (entry as any).processingStart - entry.startTime;
        console.log(`[Performance] FID: ${metricsRef.current.fid?.toFixed(2)}ms`);
      });
    });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      metricsRef.current.cls = clsValue;
      console.log(`[Performance] CLS: ${clsValue.toFixed(4)}`);
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('[Performance] Observer not supported:', error);
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, [configId]);

  return metricsRef.current;
}

/**
 * Connection-Aware Image Quality
 */
export function useAdaptiveImageQuality() {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    const connection = (navigator as any).connection;
    
    if (connection) {
      const updateQuality = () => {
        if (connection.effectiveType === '4g') {
          setQuality('high');
        } else if (connection.effectiveType === '3g') {
          setQuality('medium');
        } else {
          setQuality('low');
        }
      };

      updateQuality();
      connection.addEventListener('change', updateQuality);

      return () => {
        connection.removeEventListener('change', updateQuality);
      };
    }
  }, []);

  const getQualityParams = (baseUrl: string) => {
    const qualityMap = {
      high: { q: 85, f: 'auto' },
      medium: { q: 70, f: 'auto' },
      low: { q: 50, f: 'webp' },
    };

    const params = qualityMap[quality];
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    return `${baseUrl}${separator}q=${params.q}&f=${params.f}`;
  };

  return { quality, getQualityParams };
}