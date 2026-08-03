import React from 'react';
import { cn } from './cn';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-8 min-h-[300px]', className)}>
      <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-4">
        {icon}
      </div>
      <h3 className="text-section-header text-neutral-900 dark:text-neutral-100 mb-1">{title}</h3>
      <p className="text-body text-neutral-500 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
