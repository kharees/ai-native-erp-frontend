'use client';
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from './cn';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

const widthClasses = {
  sm: 'w-[320px]',
  md: 'w-[400px]',
  lg: 'w-[600px]',
  full: 'w-full md:w-[600px]',
};

export function Drawer({ isOpen, onClose, title, children, width = 'md', className }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={cn(
          'relative h-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col animate-slide-left',
          widthClasses[width],
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-card-title text-neutral-900 dark:text-neutral-50">{title}</h2>
            <button 
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
