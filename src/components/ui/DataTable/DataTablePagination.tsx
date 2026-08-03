import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function DataTablePagination({ 
  page, 
  pageSize, 
  total, 
  onPageChange, 
  onPageSizeChange 
}: { 
  page: number; 
  pageSize: number; 
  total: number; 
  onPageChange: (p: number) => void; 
  onPageSizeChange: (s: number) => void; 
}) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-caption text-neutral-500">
          <span>Rows per page</span>
          <select 
            value={pageSize} 
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="bg-transparent border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-accent-500 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <span className="text-caption text-neutral-500">
          {start}-{end} of {total}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 transition-colors focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || totalPages === 0}
          className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 transition-colors focus:outline-none focus:ring-1 focus:ring-accent-500"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
