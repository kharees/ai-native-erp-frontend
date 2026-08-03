/**
 * cn.ts — Class Name Utility
 * ==========================
 * Merges Tailwind classes safely: clsx handles conditionals/arrays,
 * tailwind-merge de-duplicates conflicting utility classes (e.g. two
 * `p-*` rules — the last one wins, like CSS specificity).
 *
 * Usage:
 *   cn('px-4 py-2', isActive && 'bg-accent-600', className)
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
