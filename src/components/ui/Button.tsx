'use client';

/**
 * Button.tsx
 * ==========
 * Shared button component with all design-system variants.
 *
 * Variants:
 *   primary     — accent-600 fill, white text. Use for the ONE primary action per screen.
 *   secondary   — neutral-800 fill, neutral-100 text. Use for secondary actions.
 *   outline     — transparent fill, neutral-600 border, neutral-200 text. "Discard"-style.
 *   ghost       — no fill or border, neutral-400 text. For low-emphasis icon actions.
 *   destructive — danger-DEFAULT fill, white text. Irreversible actions only.
 *
 * Sizes: sm | md (default) | lg
 *
 * Usage:
 *   <Button variant="primary" size="md" onClick={save}>Save Settings</Button>
 *   <Button variant="outline" onClick={discard}>Discard Changes</Button>
 *   <Button variant="destructive" isLoading={deleting}>Delete</Button>
 */

import React from 'react';
import { cn } from './cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** If true, renders as a full-width block element */
  fullWidth?: boolean;
  /** Left-side icon element */
  leftIcon?: React.ReactNode;
  /** Right-side icon element */
  rightIcon?: React.ReactNode;
}

// ─── Style Maps ───────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-accent-600 text-white',
    'hover:bg-accent-700',
    'active:bg-accent-800',
    'disabled:bg-accent-600/50 disabled:cursor-not-allowed',
    'shadow-sm',
  ].join(' '),

  secondary: [
    'bg-neutral-800 text-neutral-100 border border-neutral-700',
    'hover:bg-neutral-700 hover:border-neutral-600',
    'active:bg-neutral-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  outline: [
    'bg-transparent text-neutral-200 border border-neutral-600',
    'hover:bg-neutral-800 hover:border-neutral-500 hover:text-neutral-100',
    'active:bg-neutral-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  ghost: [
    'bg-transparent text-neutral-400',
    'hover:bg-neutral-800 hover:text-neutral-200',
    'active:bg-neutral-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  destructive: [
    'bg-danger text-white',
    'hover:bg-danger-dark',
    'active:bg-danger-dark',
    'disabled:bg-danger/50 disabled:cursor-not-allowed',
    'shadow-sm',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-6 px-2.5 text-caption rounded-btn gap-1.5',
  md: 'h-8 px-3 text-label rounded-btn gap-2',
  lg: 'h-10 px-4 text-body rounded-btn gap-2',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium',
          'transition-colors duration-150',
          'select-none whitespace-nowrap',
          // Variant
          variantClasses[variant],
          // Size
          sizeClasses[size],
          // Full width
          fullWidth && 'w-full',
          // Loading cursor
          isLoading && 'cursor-wait',
          // Consumer overrides
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = 'Button';

// ─── Loading Spinner ──────────────────────────────────────────────────────────

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
      />
      <path
        d="M12 2 A10 10 0 0 1 22 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
