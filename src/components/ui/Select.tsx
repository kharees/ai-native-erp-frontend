'use client';

/**
 * Select.tsx
 * ==========
 * Native <select> with design-system styling. Reuses the shared field
 * base classes from Input.tsx for visual consistency.
 *
 * Includes an inline SVG chevron so appearance:none works cross-browser
 * while still showing a caret.
 *
 * Usage:
 *   <Select label="Currency" error={errors.currency?.message}>
 *     <option value="USD">USD ($)</option>
 *     <option value="INR">INR (₹)</option>
 *   </Select>
 */

import React from 'react';
import { cn } from './cn';
import { fieldBaseClasses, fieldErrorClasses } from './Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      required,
      wrapperClassName,
      className,
      id,
      children,
      ...props
    },
    ref,
  ) => {
    const selectId = id ?? (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'text-label uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-medium',
              required && "after:content-['*'] after:ml-0.5 after:text-danger",
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
            className={cn(
              fieldBaseClasses,
              // Remove native appearance so custom chevron shows
              'appearance-none pr-9',
              // Options inherit these colors (the global select/option fix in globals.css
              // covers the native popup; this handles the closed box)
              'text-neutral-900 dark:text-neutral-100',
              error && fieldErrorClasses,
              className,
            )}
            {...props}
          >
            {children}
          </select>

          {/* Custom chevron — pure CSS, no JS */}
          <span
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </div>

        {error ? (
          <p id={`${selectId}-error`} role="alert" className="text-caption text-danger flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
            </svg>
            {error}
          </p>
        ) : hint ? (
          <p id={`${selectId}-hint`} className="text-caption text-neutral-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Select.displayName = 'Select';
