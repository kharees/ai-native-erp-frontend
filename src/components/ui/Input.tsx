'use client';

/**
 * Input.tsx
 * =========
 * Text input with consistent focus ring (accent-600), error border (danger),
 * disabled state, and optional label/helper/error message wiring.
 *
 * Usage:
 *   <Input
 *     label="Company Name"
 *     placeholder="Enter company name"
 *     error="This field is required"
 *   />
 *   <Input id="email" type="email" label="Email" />
 */

import React from 'react';
import { cn } from './cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders a <label> element above the input */
  label?: string;
  /** Helper text rendered below the input (hidden when error is set) */
  hint?: string;
  /** Error message. When present, the input border turns danger-red */
  error?: string;
  /** Renders a required asterisk next to the label */
  required?: boolean;
  /** Renders an element to the left inside the input (icon or currency symbol) */
  leftAddon?: React.ReactNode;
  /** Renders an element to the right inside the input */
  rightAddon?: React.ReactNode;
  /** Container className */
  wrapperClassName?: string;
}

// Shared field base styles — used by Input, Select, Textarea
export const fieldBaseClasses = [
  'w-full',
  'bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700',
  'text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500',
  'rounded-input px-2.5 py-1.5',
  'text-body',
  'transition-colors duration-150',
  // Focus — override the global focus-visible ring with a tighter inner ring
  'focus:outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500',
  // Disabled
  'disabled:opacity-50 disabled:bg-neutral-50 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed',
].join(' ');

export const fieldErrorClasses =
  'border-danger focus:ring-danger/40 focus:border-danger';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      required,
      leftAddon,
      rightAddon,
      wrapperClassName,
      className,
      id,
      ...props
    },
    ref,
  ) => {
    // Generate a stable id for label association if not provided
    const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-label uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-medium',
              required && "after:content-['*'] after:ml-0.5 after:text-danger",
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftAddon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={cn(
              fieldBaseClasses,
              leftAddon && 'pl-9',
              rightAddon && 'pr-9',
              error && fieldErrorClasses,
              className,
            )}
            {...props}
          />
          {rightAddon && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {rightAddon}
            </span>
          )}
        </div>

        {error ? (
          <p id={`${inputId}-error`} role="alert" className="text-caption text-danger dark:text-danger flex items-center gap-1">
            <ErrorIcon />
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-caption text-neutral-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

// Inline error icon — avoids importing lucide in every form
function ErrorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
    </svg>
  );
}
