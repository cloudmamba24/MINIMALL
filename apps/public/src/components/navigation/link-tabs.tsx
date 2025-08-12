"use client";

import { useTabGestures } from "@/hooks/use-gesture-handler";
import { Tab as HeadlessTab } from "@headlessui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode | null;
  onClick?: () => void;
  isAction?: boolean;
}

interface LinkTabsProps {
  tabs: Tab[];
  className?: string;
}

export function LinkTabs({ tabs, className = "" }: LinkTabsProps) {
  // Development debugging
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log("[LinkTabs] Render with tabs count:", tabs.length, "timestamp:", Date.now());
  }

  // Memoize filtered tabs to prevent re-creation on every render
  const contentTabs = useMemo(() => tabs.filter((tab) => !tab.isAction), [tabs]);

  const [activeTab, setActiveTab] = useState("");

  // Set initial active tab only once when contentTabs are available
  useEffect(() => {
    if (!activeTab && contentTabs.length > 0 && contentTabs[0]) {
      setActiveTab(contentTabs[0].id);
    }
  }, [contentTabs, activeTab]);

  // Gesture navigation between tabs
  const navigateToNextTab = useCallback(() => {
    const currentIndex = contentTabs.findIndex((tab) => tab.id === activeTab);
    const nextIndex = (currentIndex + 1) % contentTabs.length;
    if (contentTabs[nextIndex]) {
      setActiveTab(contentTabs[nextIndex].id);
    }
  }, [contentTabs, activeTab]);

  const navigateToPrevTab = useCallback(() => {
    const currentIndex = contentTabs.findIndex((tab) => tab.id === activeTab);
    const prevIndex = currentIndex <= 0 ? contentTabs.length - 1 : currentIndex - 1;
    if (contentTabs[prevIndex]) {
      setActiveTab(contentTabs[prevIndex].id);
    }
  }, [contentTabs, activeTab]);

  const { gestureProps } = useTabGestures(navigateToNextTab, navigateToPrevTab);

  const handleTabClick = (tab: Tab) => {
    if (tab.isAction && tab.onClick) {
      tab.onClick();
    } else {
      setActiveTab(tab.id);
    }
  };

  const selectedIndex = Math.max(
    0,
    contentTabs.findIndex((t) => t.id === activeTab)
  );

  return (
    <div className={`w-full ${className}`} {...gestureProps}>
      <HeadlessTab.Group
        selectedIndex={selectedIndex}
        onChange={(idx) => {
          const tab = contentTabs[idx];
          if (tab) setActiveTab(tab.id);
        }}
      >
        <div className="flex justify-center mb-8">
          <HeadlessTab.List className="flex space-x-8">
            {tabs.map((tab) => (
              <HeadlessTab
                key={tab.id}
                as="button"
                onClick={() => handleTabClick(tab)}
                className={({ selected }) =>
                  `text-sm font-medium tracking-wide transition-colors duration-200 ${
                    selected && !tab.isAction
                      ? "text-white border-b-2 border-white pb-1"
                      : "text-gray-400 hover:text-gray-200"
                  } ${tab.isAction ? "hover:text-white" : ""}`
                }
              >
                {tab.label}
              </HeadlessTab>
            ))}
          </HeadlessTab.List>
        </div>
        {contentTabs.length > 1 && (
          <div className="text-center mb-4">
            <p className="text-xs text-gray-500">Swipe left or right to navigate between tabs</p>
          </div>
        )}
        <div className="transition-opacity duration-300">
          {contentTabs.find((tab) => tab.id === activeTab)?.content}
        </div>
      </HeadlessTab.Group>
    </div>
  );
}
