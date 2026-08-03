'use client';

/**
 * PageHeader.tsx
 * ==============
 * Standardized page header matching the pattern seen on Organization Settings
 * and Dashboard. Eliminates the ad-hoc inline styles and class differences
 * between pages.
 *
 * Props:
 *   title     — Page title (h1, text-page-title)
 *   subtitle  — Descriptive subtitle (text-body, neutral-400 — WCAG AA ≥ 4.5:1 on dark bg)
 *   actions   — ReactNode slot for right-side buttons (e.g. Save / Discard)
 *   backHref  — If provided, renders a "← Back" link before the title
 *   backLabel — Label for the back link (default: "Back")
 *
 * Usage:
 *   <PageHeader
 *     title="Organization Settings"
 *     subtitle="Manage your company profile, branches, departments, and global preferences."
 *     actions={
 *       <>
 *         <Button variant="outline" onClick={discard}>Discard Changes</Button>
 *         <Button variant="primary" onClick={save}>Save Settings</Button>
 *       </>
 *     }
 *   />
 */

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from './cn';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-side action buttons slot */
  actions?: React.ReactNode;
  /** Optional back navigation href */
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
  backLabel = 'Back',
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('mb-4 md:mb-5', className)}>
      {/* Back link */}
      {backHref && (
        <Link
          href={backHref}
          className={cn(
            'inline-flex items-center gap-1 mb-3',
            'text-caption text-neutral-500 dark:text-neutral-400',
            'hover:text-accent-400 transition-colors',
          )}
        >
          <ChevronLeft size={14} aria-hidden />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* Title + subtitle */}
        <div className="min-w-0">
          <h1 className="text-page-title text-neutral-900 dark:text-neutral-50 tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p
              className={cn(
                'mt-1 text-body text-neutral-500 dark:text-neutral-400',
                // neutral-400 (#94A3B8) on neutral-950 (#020617) bg = ~6.5:1 — passes WCAG AA
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
