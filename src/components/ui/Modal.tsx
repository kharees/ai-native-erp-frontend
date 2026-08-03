'use client';

/**
 * Modal.tsx
 * =========
 * Accessible modal dialog with a correctly semi-transparent backdrop.
 *
 * FIXED BUG: The previous modal implementation used a flat opaque gray
 * backdrop (likely `bg-gray-900` or an inline style `background: #111827`)
 * that covered the entire page as a solid fill. This component uses:
 *
 *   bg-black/60 backdrop-blur-sm
 *
 * which gives 60% opacity black — the page content is still visible and
 * recognizable behind the overlay, confirming the modal context.
 *
 * Features:
 *   - Focus trap: Tab key cycles only within the modal
 *   - Escape key: closes the modal
 *   - Body scroll lock while open
 *   - Animated: backdrop fades in, panel slides up
 *   - ARIA: role="dialog", aria-modal, aria-labelledby
 *   - Sizes: sm (480px), md (640px, default), lg (800px), xl (1024px), full
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *
 *   <Button onClick={() => setOpen(true)}>Open Modal</Button>
 *
 *   <Modal
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     title="Confirm Action"
 *   >
 *     <p>Are you sure you want to delete this record?</p>
 *     <Modal.Footer>
 *       <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
 *       <Button variant="destructive">Delete</Button>
 *     </Modal.Footer>
 *   </Modal>
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  /** If true, clicking the backdrop does NOT close the modal */
  preventBackdropClose?: boolean;
  /** If true, the Escape key does NOT close the modal */
  preventEscapeClose?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm:   'max-w-[480px]',
  md:   'max-w-[640px]',
  lg:   'max-w-[800px]',
  xl:   'max-w-[1024px]',
  full: 'max-w-[calc(100vw-2rem)]',
};

// ─── Focusable Element Selector ───────────────────────────────────────────────

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  preventBackdropClose = false,
  preventEscapeClose = false,
  children,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;
  const descId  = useRef(`modal-desc-${Math.random().toString(36).slice(2)}`).current;

  // ── Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventEscapeClose) {
        onClose();
        return;
      }
      // Focus trap — cycle Tab within the dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose, preventEscapeClose],
  );

  // ── Mount / unmount effects
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Attach key listener
    document.addEventListener('keydown', handleKeyDown);

    // Focus first focusable element in dialog
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    if (focusable?.length) {
      // Defer until render settles
      setTimeout(() => focusable[0]?.focus(), 20);
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    // ── Backdrop ─────────────────────────────────────────────────────────────
    // KEY FIX: bg-black/60 + backdrop-blur-sm = semi-transparent overlay.
    // The page content is visibly dimmed but recognizable, confirming modal context.
    // Previous bug: solid bg-gray-900 / #111827 — opaque, hid entire page.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={preventBackdropClose ? undefined : (e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-hidden="true"
    >
      {/* ── Dialog Panel ──────────────────────────────────────────────────── */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative w-full',
          sizeClasses[size],
          // Surface
          'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700',
          'rounded-dialog shadow-dialog',
          // Animation
          'animate-slide-up',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        {(title || description) && (
          <div className="flex items-start justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <div>
              {title && (
                <h2 id={titleId} className="text-card-title text-neutral-900 dark:text-neutral-50">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-caption text-neutral-500 dark:text-neutral-400">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'ml-4 p-1.5 rounded-md shrink-0',
                'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200',
                'hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
              )}
              aria-label="Close dialog"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="px-4 py-4 text-neutral-800 dark:text-neutral-200 text-body">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Modal.Footer ─────────────────────────────────────────────────────────────

Modal.Footer = function ModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'pt-3 mt-1 border-t border-neutral-200 dark:border-neutral-800',
        className,
      )}
    >
      {children}
    </div>
  );
};
