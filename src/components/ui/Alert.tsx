import React from 'react';
import { cn } from './cn';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  title?: string;
  children: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
}

const variantStyles = {
  info:    'bg-accent-50 dark:bg-accent-950/30 border-accent-200 dark:border-accent-800 text-accent-800 dark:text-accent-300',
  success: 'bg-success-light dark:bg-green-950/30 border-green-200 dark:border-green-800 text-success-dark dark:text-green-400',
  warning: 'bg-warning-light dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-warning-dark dark:text-amber-400',
  error:   'bg-danger-light dark:bg-red-950/30 border-red-200 dark:border-red-800 text-danger-dark dark:text-red-400',
};

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export function Alert({ title, children, variant = 'info', className }: AlertProps) {
  const Icon = icons[variant];
  return (
    <div className={cn('flex gap-3 p-3 rounded-card border text-body', variantStyles[variant], className)} role="alert">
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <h5 className="font-semibold mb-1 text-card-title">{title}</h5>}
        <div className="text-opacity-90">{children}</div>
      </div>
    </div>
  );
}
