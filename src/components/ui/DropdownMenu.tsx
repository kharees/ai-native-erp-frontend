'use client';
import React, { useState, useRef, useEffect } from 'react';
import { cn } from './cn';

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, children, className, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-flex">
        {trigger}
      </div>
      {isOpen && (
        <div 
          className={cn(
            'absolute z-50 mt-1 min-w-[160px] rounded-md bg-white dark:bg-neutral-900 shadow-dropdown border border-neutral-200 dark:border-neutral-800 py-1 focus:outline-none animate-in fade-in zoom-in-95',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className
          )}
          onClick={() => setIsOpen(false)} // close on item click
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

export function DropdownMenuItem({ children, className, destructive, ...props }: DropdownMenuItemProps) {
  return (
    <button
      className={cn(
        'block w-full text-left px-3 py-1.5 text-body transition-colors outline-none',
        destructive 
          ? 'text-danger hover:bg-danger-light dark:hover:bg-red-950/50 focus:bg-danger-light dark:focus:bg-red-950/50' 
          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 focus:bg-neutral-100 dark:focus:bg-neutral-800',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-1" />;
}
