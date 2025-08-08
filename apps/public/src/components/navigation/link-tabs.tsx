'use client';

import { useState } from 'react';

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
  // Filter content tabs (exclude action tabs)
  const contentTabs = tabs.filter(tab => !tab.isAction);
  const actionTabs = tabs.filter(tab => tab.isAction);
  
  const [activeTab, setActiveTab] = useState(contentTabs[0]?.id || '');

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