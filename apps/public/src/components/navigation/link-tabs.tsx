'use client';

import { useState, useMemo, useEffect } from 'react';

interface Tab {
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
  // Production debugging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.log('[LinkTabs] Render with tabs count:', tabs.length, 'timestamp:', Date.now());
  }
  
  // Memoize filtered tabs to prevent re-creation on every render
  const contentTabs = useMemo(() => tabs.filter(tab => !tab.isAction), [tabs]);
  const actionTabs = useMemo(() => tabs.filter(tab => tab.isAction), [tabs]);
  
  const [activeTab, setActiveTab] = useState('');
  
  // Set initial active tab only once when contentTabs are available
  useEffect(() => {
    if (!activeTab && contentTabs.length > 0 && contentTabs[0]) {
      setActiveTab(contentTabs[0].id);
    }
  }, [contentTabs, activeTab]);

  const handleTabClick = (tab: Tab) => {
    if (tab.isAction && tab.onClick) {
      tab.onClick();
    } else {
      setActiveTab(tab.id);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`
                text-sm font-medium tracking-wide transition-colors duration-200
                ${activeTab === tab.id && !tab.isAction
                  ? 'text-white border-b-2 border-white pb-1' 
                  : 'text-gray-400 hover:text-gray-200'
                }
                ${tab.isAction ? 'hover:text-white' : ''}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-opacity duration-300">
        {contentTabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}