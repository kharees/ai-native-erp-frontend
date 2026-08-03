import React from 'react';
import { cn } from './cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
  /** Stable E2E selector, e.g. data-testid="stat-revenue". */
  'data-testid'?: string;
}

export function StatCard({ label, value, trend, trendValue, icon, className, 'data-testid': testId }: StatCardProps) {
  return (
    <div data-testid={testId} className={cn('bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-card p-4 shadow-card flex flex-col justify-between', className)}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-caption text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</h3>
        {icon && <div className="text-neutral-400">{icon}</div>}
      </div>
      <div className="flex items-end justify-between mt-1">
        <div className="text-page-title font-semibold text-neutral-900 dark:text-neutral-50">{value}</div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-caption font-medium mb-1',
            trend === 'up' ? 'text-success-dark dark:text-green-400' : 
            trend === 'down' ? 'text-danger-dark dark:text-red-400' : 
            'text-neutral-500 dark:text-neutral-400'
          )}>
            {trend === 'up' && <TrendingUp size={14} />}
            {trend === 'down' && <TrendingDown size={14} />}
            {trend === 'neutral' && <Minus size={14} />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
