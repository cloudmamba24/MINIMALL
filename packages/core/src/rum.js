class RealUserMonitoring {
    config;
    interactions = [];
    sessionStartTime;
    isActive = false;
    constructor(config = {}) {
        this.config = {
            enableConsoleLogging: false,
            enableResourceTiming: true,
            enableNavigationTiming: true,
            enableUserInteractions: true,
            sampleRate: 1.0,
            ...config,
        };
        this.sessionStartTime = performance.now();
        // Generate session ID if not provided
        if (!this.config.sessionId) {
            this.config.sessionId = `rum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    /**
     * Initialize RUM tracking
     */
    init() {
        if (typeof window === "undefined")
            return;
        // Check sampling rate
        if (Math.random() > (this.config.sampleRate || 1.0)) {
            return; // Skip tracking based on sample rate
        }
        this.isActive = true;
        if (this.config.enableNavigationTiming) {
            this.trackNavigationTiming();
        }
        if (this.config.enableResourceTiming) {
            this.trackResourceTiming();
        }
        if (this.config.enableUserInteractions) {
            this.setupUserInteractionTracking();
        }
        // Track page visibility changes
        this.setupVisibilityTracking();
        // Track unload events
        this.setupUnloadTracking();
        // Track JavaScript errors
        this.setupErrorTracking();
        // Send periodic reports
        this.startPeriodicReporting();
        this.log("RUM tracking initialized", { sessionId: this.config.sessionId });
    }
    /**
     * Track navigation timing
     */
    trackNavigationTiming() {
        if (typeof window === "undefined" || !window.performance?.timing)
            return;
        const timing = window.performance.timing;
        const navigation = window.performance.navigation;
        const navigationMetrics = {
            type: navigation?.type === 1 ? "reload" : navigation?.type === 2 ? "back_forward" : "navigate",
            redirectCount: navigation?.redirectCount || 0,
            // Time to first byte
            ttfb: timing.responseStart - timing.navigationStart,
            // DNS lookup time
            dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
            // TCP connection time
            connectTime: timing.connectEnd - timing.connectStart,
            // Request/response time
            requestTime: timing.responseEnd - timing.requestStart,
            // DOM processing time
            domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
            // Full load time
            loadTime: timing.loadEventEnd - timing.navigationStart,
            // DOM processing
            domProcessingTime: timing.domComplete - timing.domLoading,
        };
        this.sendEvent("navigation_timing", navigationMetrics);
    }
    /**
     * Track resource timing
     */
    trackResourceTiming() {
        if (typeof window === "undefined" || !window.performance?.getEntriesByType)
            return;
        // Track resources periodically
        setInterval(() => {
            const resources = window.performance.getEntriesByType("resource");
            const slowResources = resources.filter((resource) => resource.duration > 1000); // > 1s
            if (slowResources.length > 0) {
                this.sendEvent("slow_resources", {
                    resources: slowResources.slice(-10).map((resource) => ({
                        name: resource.name,
                        duration: resource.duration,
                        size: resource.transferSize,
                        type: resource.initiatorType,
                    })),
                });
            }
        }, 30000); // Check every 30 seconds
    }
    /**
     * Setup user interaction tracking
     */
    setupUserInteractionTracking() {
        if (typeof window === "undefined")
            return;
        // Click tracking
        document.addEventListener("click", (event) => {
            const target = event.target;
            this.addInteraction("click", {
                target: this.getElementSelector(target),
                x: event.clientX,
                y: event.clientY,
            });
        }, { passive: true });
        // Scroll tracking (throttled)
        let scrollTimeout;
        document.addEventListener("scroll", () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.addInteraction("scroll", {
                    scrollY: window.scrollY,
                    scrollHeight: document.documentElement.scrollHeight,
                    viewportHeight: window.innerHeight,
                    scrollPercent: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100),
                });
            }, 100);
        }, { passive: true });
        // Resize tracking
        window.addEventListener("resize", () => {
            this.addInteraction("resize", {
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }, { passive: true });
        // Focus/blur tracking
        window.addEventListener("focus", () => {
            this.addInteraction("focus");
        });
        window.addEventListener("blur", () => {
            this.addInteraction("blur");
        });
    }
    /**
     * Setup visibility tracking
     */
    setupVisibilityTracking() {
        if (typeof document === "undefined")
            return;
        let visibilityStart = performance.now();
        document.addEventListener("visibilitychange", () => {
            const now = performance.now();
            if (document.hidden) {
                // Page became hidden
                const visibleTime = now - visibilityStart;
                this.sendEvent("page_visibility", {
                    action: "hidden",
                    visibleTime: Math.round(visibleTime),
                });
            }
            else {
                // Page became visible
                visibilityStart = now;
                this.sendEvent("page_visibility", {
                    action: "visible",
                });
            }
        });
    }
    /**
     * Setup unload tracking
     */
    setupUnloadTracking() {
        if (typeof window === "undefined")
            return;
        const sendFinalReport = () => {
            const sessionDuration = performance.now() - this.sessionStartTime;
            this.sendEvent("session_end", {
                sessionDuration: Math.round(sessionDuration),
                interactions: this.interactions.length,
                url: window.location.href,
            }, true); // Force send
        };
        // Use both beforeunload and pagehide for better coverage
        window.addEventListener("beforeunload", sendFinalReport);
        window.addEventListener("pagehide", sendFinalReport);
    }
    /**
     * Setup error tracking
     */
    setupErrorTracking() {
        if (typeof window === "undefined")
            return;
        // JavaScript errors
        window.addEventListener("error", (event) => {
            this.sendEvent("javascript_error", {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                url: window.location.href,
            });
        });
        // Unhandled promise rejections
        window.addEventListener("unhandledrejection", (event) => {
            this.sendEvent("unhandled_rejection", {
                reason: event.reason?.toString(),
                stack: event.reason?.stack,
                url: window.location.href,
            });
        });
    }
    /**
     * Start periodic reporting
     */
    startPeriodicReporting() {
        // Send interaction summary every minute
        setInterval(() => {
            if (this.interactions.length > 0) {
                this.sendInteractionSummary();
            }
        }, 60000);
        // Send memory usage if available
        setInterval(() => {
            if ("memory" in performance) {
                const memory = performance.memory;
                this.sendEvent("memory_usage", {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                });
            }
        }, 300000); // Every 5 minutes
    }
    /**
     * Add user interaction
     */
    addInteraction(type, data) {
        if (!this.isActive)
            return;
        this.interactions.push({
            type,
            timestamp: performance.now(),
            data,
        });
        // Keep only last 100 interactions
        if (this.interactions.length > 100) {
            this.interactions = this.interactions.slice(-100);
        }
    }
    /**
     * Send interaction summary
     */
    sendInteractionSummary() {
        const summary = this.interactions.reduce((acc, interaction) => {
            acc[interaction.type] = (acc[interaction.type] || 0) + 1;
            return acc;
        }, {});
        this.sendEvent("interaction_summary", {
            interactions: summary,
            totalInteractions: this.interactions.length,
            timeframe: "1m",
        });
        // Clear interactions after sending summary
        this.interactions = [];
    }
    /**
     * Send event to analytics endpoint
     */
    sendEvent(eventType, data, forceSync = false) {
        if (!this.isActive)
            return;
        const payload = {
            event: `rum_${eventType}`,
            configId: this.config.configId,
            userId: this.config.userId,
            sessionId: this.config.sessionId,
            properties: {
                ...data,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                sessionDuration: Math.round(performance.now() - this.sessionStartTime),
            },
        };
        // Send to analytics endpoint
        const sendRequest = () => {
            fetch("/api/analytics/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                keepalive: forceSync, // Ensure request completes during unload
            }).catch((error) => {
                this.log("Failed to send RUM event:", error);
            });
        };
        if (forceSync && navigator.sendBeacon) {
            // Use sendBeacon for reliable delivery during unload
            navigator.sendBeacon("/api/analytics/events", JSON.stringify(payload));
        }
        else {
            sendRequest();
        }
        this.log(`RUM Event: ${eventType}`, data);
    }
    /**
     * Get element selector for tracking
     */
    getElementSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        if (element.className) {
            return `.${element.className.split(" ")[0]}`;
        }
        return element.tagName.toLowerCase();
    }
    /**
     * Debug logging
     */
    log(message, data) {
        if (this.config.enableConsoleLogging) {
            console.log(`[RUM] ${message}`, data);
        }
    }
    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Stop RUM tracking
     */
    stop() {
        this.isActive = false;
    }
    /**
     * Get session information
     */
    getSession() {
        return {
            sessionId: this.config.sessionId || "unknown",
            duration: Math.round(performance.now() - this.sessionStartTime),
            interactions: this.interactions.length,
        };
    }
}
// Export singleton instance
export const rum = new RealUserMonitoring();
// Export class for custom instances
export { RealUserMonitoring };
//# sourceMappingURL=rum.js.map