'use client';

/**
 * Badge.tsx
 * =========
 * Semantic badge/chip component. Maps directly to the design system's
 * semantic color tokens: success (green), warning (amber), danger (red),
 * neutral (slate), accent (blue), plus a special "navy" for internal tags.
 *
 * Each variant uses the `light` background + the solid `DEFAULT` text
 * color for optimal contrast in both light and dark contexts.
 *
 * Usage:
 *   <Badge variant="success">Active</Badge>
 *   <Badge variant="danger">Failed</Badge>
 *   <Badge variant="warning" dot>Review Required</Badge>
 *   <Badge variant="accent">New</Badge>
 */

import React from 'react';
import { cn } from './cn';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'accent' | 'navy';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Shows a leading status dot of the same color */
  dot?: boolean;
}

// ─── Variant Styles ───────────────────────────────────────────────────────────
// Each variant: bg is the `light` token, text is the `DEFAULT` (or `dark`) token.
// Dark mode override uses deeper backgrounds and slightly brighter text.

const variantClasses: Record<BadgeVariant, string> = {
  success: [
    'bg-success-light text-success-dark',
    // Dark mode: dark bg, green-400 text
    'dark:bg-green-950 dark:text-green-400',
  ].join(' '),

  warning: [
    'bg-warning-light text-warning-dark',
    'dark:bg-amber-950 dark:text-amber-400',
  ].join(' '),

  danger: [
    'bg-danger-light text-danger-dark',
    'dark:bg-red-950 dark:text-red-400',
  ].join(' '),

  neutral: [
    'bg-neutral-100 text-neutral-700',
    'dark:bg-neutral-800 dark:text-neutral-300',
  ].join(' '),

  accent: [
    'bg-accent-100 text-accent-800',
    'dark:bg-accent-950 dark:text-accent-300',
  ].join(' '),

  navy: [
    'bg-navy-100 text-navy-700',
    'dark:bg-navy-900 dark:text-navy-300',
  ].join(' '),
};

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-success dark:bg-green-400',
  warning: 'bg-warning dark:bg-amber-400',
  danger:  'bg-danger dark:bg-red-400',
  neutral: 'bg-neutral-500 dark:bg-neutral-400',
  accent:  'bg-accent-600 dark:bg-accent-400',
  navy:    'bg-navy-600 dark:bg-navy-400',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', dot = false, className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5',
        'px-1.5 py-0.5',
        'rounded-badge text-caption font-medium',
        'whitespace-nowrap',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClasses[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  ),
);

Badge.displayName = 'Badge';
