interface RUMConfig {
    configId?: string;
    userId?: string;
    sessionId?: string;
    enableConsoleLogging?: boolean;
    enableResourceTiming?: boolean;
    enableNavigationTiming?: boolean;
    enableUserInteractions?: boolean;
    sampleRate?: number;
}
interface UserInteraction {
    type: "click" | "scroll" | "navigation" | "resize" | "focus" | "blur";
    target?: string;
    timestamp: number;
    data?: Record<string, any> | undefined;
}
declare class RealUserMonitoring {
    private config;
    private interactions;
    private sessionStartTime;
    private isActive;
    constructor(config?: RUMConfig);
    /**
     * Initialize RUM tracking
     */
    init(): void;
    /**
     * Track navigation timing
     */
    private trackNavigationTiming;
    /**
     * Track resource timing
     */
    private trackResourceTiming;
    /**
     * Setup user interaction tracking
     */
    private setupUserInteractionTracking;
    /**
     * Setup visibility tracking
     */
    private setupVisibilityTracking;
    /**
     * Setup unload tracking
     */
    private setupUnloadTracking;
    /**
     * Setup error tracking
     */
    private setupErrorTracking;
    /**
     * Start periodic reporting
     */
    private startPeriodicReporting;
    /**
     * Add user interaction
     */
    private addInteraction;
    /**
     * Send interaction summary
     */
    private sendInteractionSummary;
    /**
     * Send event to analytics endpoint
     */
    private sendEvent;
    /**
     * Get element selector for tracking
     */
    private getElementSelector;
    /**
     * Debug logging
     */
    private log;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<RUMConfig>): void;
    /**
     * Stop RUM tracking
     */
    stop(): void;
    /**
     * Get session information
     */
    getSession(): {
        sessionId: string;
        duration: number;
        interactions: number;
    };
}
export declare const rum: RealUserMonitoring;
export { RealUserMonitoring };
export type { RUMConfig, UserInteraction };
//# sourceMappingURL=rum.d.ts.map