'use client';
import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-dialog overflow-hidden shadow-2xl flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search size={18} className="text-neutral-400 mr-3 shrink-0" />
          <input
            className="flex-1 bg-transparent text-[15px] text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 focus:outline-none h-8"
            placeholder="Type a command or search..."
            autoFocus
          />
          <kbd className="hidden sm:inline-block border border-neutral-200 dark:border-neutral-700 rounded bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-caption text-neutral-500 font-sans">
            ESC
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Mock results */}
          <div className="px-2 py-1.5 text-caption font-medium text-neutral-500 uppercase tracking-wider">Suggestions</div>
          <button className="w-full flex items-center px-3 py-2 text-body text-neutral-900 dark:text-neutral-100 rounded-md hover:bg-accent-50 dark:hover:bg-accent-900/30 hover:text-accent-700 dark:hover:text-accent-400 transition-colors">
            Create New Invoice
          </button>
          <button className="w-full flex items-center px-3 py-2 text-body text-neutral-900 dark:text-neutral-100 rounded-md hover:bg-accent-50 dark:hover:bg-accent-900/30 hover:text-accent-700 dark:hover:text-accent-400 transition-colors">
            View Settings
          </button>
        </div>
      </div>
    </div>
  );
}
