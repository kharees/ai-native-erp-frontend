import React from 'react';
import { cn } from './cn';

export function FormSection({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <h3 className="text-section-header text-neutral-900 dark:text-neutral-50">{title}</h3>
        {description && <p className="text-body text-neutral-500 dark:text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}

export function FormRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col md:flex-row gap-4', className)}>
      {React.Children.map(children, (child) => (
        <div className="flex-1 min-w-0">{child}</div>
      ))}
    </div>
  );
}
