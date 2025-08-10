// Global type definitions for MINIMALL core package

// Network Information API types
interface NetworkInformation {
  readonly effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
  onchange?: EventListener;
}

// Extend Navigator interface
interface Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

// Performance Observer types
interface PerformanceObserverEntryList {
  getEntries(): PerformanceEntry[];
  getEntriesByName(name: string, type?: string): PerformanceEntry[];
  getEntriesByType(type: string): PerformanceEntry[];
}

interface PerformanceObserver {
  disconnect(): void;
  observe(options: PerformanceObserverInit): void;
  takeRecords(): PerformanceEntry[];
}

interface PerformanceObserverInit {
  entryTypes?: string[];
  type?: string;
  buffered?: boolean;
}

declare let PerformanceObserver: {
  prototype: PerformanceObserver;
  new (callback: PerformanceObserverCallback): PerformanceObserver;
  supportedEntryTypes?: string[];
};

type PerformanceObserverCallback = (
  entries: PerformanceObserverEntryList,
  observer: PerformanceObserver
) => void;

// Extend global scope
declare global {
  interface Window {
    // Web Vitals specific
    webVitals?: unknown;

    // Performance API extensions
    PerformanceObserver?: typeof PerformanceObserver;

    // Browser-specific prefixed APIs
    mozRequestIdleCallback?: typeof requestIdleCallback;
    webkitRequestIdleCallback?: typeof requestIdleCallback;
  }
}

export {};
