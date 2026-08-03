import React from 'react';
import { Search, Download } from 'lucide-react';
import { Button } from '../Button';

export function DataTableToolbar({ 
  searchTerm, 
  onSearchChange, 
  searchPlaceholder = 'Search...', 
  onExport 
}: { 
  searchTerm: string; 
  onSearchChange: (val: string) => void; 
  searchPlaceholder?: string; 
  onExport?: () => void; 
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
      <div className="relative w-full sm:w-72">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input 
          type="text" 
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-transparent border border-neutral-300 dark:border-neutral-700 rounded-input pl-9 pr-3 py-1 text-body text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
      </div>
      
      <div className="flex items-center gap-2">
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport} leftIcon={<Download size={14} />}>
            Export
          </Button>
        )}
      </div>
    </div>
  );
}
