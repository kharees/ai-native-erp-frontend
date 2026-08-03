'use client';

/**
 * Card.tsx
 * ========
 * Composable card system. Use sub-components to build structured content
 * areas that match the pattern seen across Organization Settings and Dashboard.
 *
 * Sub-components:
 *   Card         — outer container (border, shadow, rounded-card)
 *   CardHeader   — top section with bottom border
 *   CardTitle    — h3 title within a header (text-card-title)
 *   CardDescription — subtitle/description in a header (text-caption)
 *   CardContent  — main content area with padding
 *   CardFooter   — bottom action strip (right-aligned by default)
 *
 * Usage:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Company Profile</CardTitle>
 *       <CardDescription>Basic information about your organization.</CardDescription>
 *     </CardHeader>
 *     <CardContent>...</CardContent>
 *     <CardFooter>
 *       <Button variant="outline">Cancel</Button>
 *       <Button variant="primary">Save</Button>
 *     </CardFooter>
 *   </Card>
 */

import React from 'react';
import { cn } from './cn';

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove the default padding from the content area (useful when embedding a DataTable) */
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, noPadding: _noPadding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-card shadow-card overflow-hidden',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

// ─── CardHeader ───────────────────────────────────────────────────────────────

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-4 py-3 border-b border-neutral-200 dark:border-neutral-800', className)}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

// ─── CardTitle ────────────────────────────────────────────────────────────────

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-card-title text-neutral-900 dark:text-neutral-100', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

// ─── CardDescription ──────────────────────────────────────────────────────────

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      // neutral-400 on neutral-900 bg = ~5.5:1 contrast — passes WCAG AA
      className={cn('text-caption text-neutral-500 dark:text-neutral-400 mt-0.5', className)}
      {...props}
    />
  ),
);
CardDescription.displayName = 'CardDescription';

// ─── CardContent ──────────────────────────────────────────────────────────────

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-4', className)}
      {...props}
    />
  ),
);
CardContent.displayName = 'CardContent';

// ─── CardFooter ───────────────────────────────────────────────────────────────

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-3',
        className,
      )}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';
