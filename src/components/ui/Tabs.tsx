'use client';
import React from 'react';
import { cn } from './cn';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar', className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 h-9 px-4 text-label font-medium transition-colors border-b-2 mb-[-1px] whitespace-nowrap',
              isActive
                ? 'border-accent-600 text-accent-600 dark:text-accent-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
