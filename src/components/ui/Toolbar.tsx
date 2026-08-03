import React from 'react';
import { cn } from './cn';

export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 p-2 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800', className)}>
      {children}
    </div>
  );
}
