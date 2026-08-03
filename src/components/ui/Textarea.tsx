'use client';

/**
 * Textarea.tsx
 * ============
 * Multi-line text input with the same styling tokens as Input and Select.
 * Vertically resizable (resize-y) by default; pass resize="none" to lock.
 *
 * Usage:
 *   <Textarea
 *     label="Headquarters Address"
 *     placeholder="Primary business address..."
 *     rows={3}
 *   />
 */

import React from 'react';
import { cn } from './cn';
import { fieldBaseClasses, fieldErrorClasses } from './Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      required,
      wrapperClassName,
      className,
      id,
      rows = 3,
      ...props
    },
    ref,
  ) => {
    const textareaId = id ?? (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'text-label uppercase tracking-wider text-neutral-600 dark:text-neutral-400 font-medium',
              required && "after:content-['*'] after:ml-0.5 after:text-danger",
            )}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          className={cn(
            fieldBaseClasses,
            'resize-y min-h-[80px]',
            error && fieldErrorClasses,
            className,
          )}
          {...props}
        />

        {error ? (
          <p id={`${textareaId}-error`} role="alert" className="text-caption text-danger flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" />
            </svg>
            {error}
          </p>
        ) : hint ? (
          <p id={`${textareaId}-hint`} className="text-caption text-neutral-500">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
