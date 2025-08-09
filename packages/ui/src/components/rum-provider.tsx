"use client";

import { type RUMConfig, rum } from "@minimall/core";
import React, { useEffect, useContext, createContext } from "react";

interface RUMContextType {
	sessionId: string;
	isActive: boolean;
	trackEvent: (eventName: string, properties?: Record<string, any>) => void;
	updateConfig: (config: Partial<RUMConfig>) => void;
}

const RUMContext = createContext<RUMContextType | null>(null);

interface RUMProviderProps {
	children: React.ReactNode;
	config?: RUMConfig;
	enabled?: boolean;
}

export const RUMProvider: React.FC<RUMProviderProps> = ({
	children,
	config = {},
	enabled = true,
}) => {
	const [sessionInfo, setSessionInfo] = React.useState<{
		sessionId: string;
		isActive: boolean;
	}>({
		sessionId: "",
		isActive: false,
	});

	useEffect(() => {
		if (!enabled || typeof window === "undefined") return;

		// Update RUM config
		rum.updateConfig(config);

		// Initialize RUM tracking
		rum.init();

		// Get session info
		const session = rum.getSession();
		setSessionInfo({
			sessionId: session.sessionId,
			isActive: true,
		});

		// Cleanup on unmount
		return () => {
			rum.stop();
		};
	}, [enabled, config]);

	const trackEvent = (
		eventName: string,
		properties: Record<string, any> = {},
	) => {
		if (!sessionInfo.isActive) return;

		// Send custom event via the existing analytics endpoint
		fetch("/api/analytics/events", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				event: `custom_${eventName}`,
				configId: config.configId,
				userId: config.userId,
				sessionId: sessionInfo.sessionId,
				properties: {
					...properties,
					timestamp: new Date().toISOString(),
					url: window.location.href,
				},
			}),
			keepalive: true,
		}).catch((error) => {
			console.warn("Failed to track custom event:", error);
		});
	};

	const updateConfig = (newConfig: Partial<RUMConfig>) => {
		rum.updateConfig(newConfig);
	};

	const contextValue: RUMContextType = {
		sessionId: sessionInfo.sessionId,
		isActive: sessionInfo.isActive,
		trackEvent,
		updateConfig,
	};

	return (
		<RUMContext.Provider value={contextValue}>{children}</RUMContext.Provider>
	);
};

export const useRUM = (): RUMContextType => {
	const context = useContext(RUMContext);
	if (!context) {
		throw new Error("useRUM must be used within a RUMProvider");
	}
	return context;
};

// Standalone hook for tracking without provider
export const useRUMTracking = (config?: RUMConfig) => {
	useEffect(() => {
		if (typeof window === "undefined") return;

		if (config) {
			rum.updateConfig(config);
		}

		rum.init();

		return () => {
			rum.stop();
		};
	}, [config]);

	return {
		trackEvent: (eventName: string, properties: Record<string, any> = {}) => {
			fetch("/api/analytics/events", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					event: `custom_${eventName}`,
					configId: config?.configId,
					userId: config?.userId,
					sessionId: rum.getSession().sessionId,
					properties: {
						...properties,
						timestamp: new Date().toISOString(),
						url: window.location.href,
					},
				}),
				keepalive: true,
			}).catch(console.warn);
		},
		getSession: () => rum.getSession(),
	};
};
