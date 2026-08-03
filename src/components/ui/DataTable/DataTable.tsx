'use client';
import React, { useState, useMemo } from 'react';
import { cn } from '../cn';
import { Column } from './types';
import { DataTablePagination } from './DataTablePagination';
import { DataTableToolbar } from './DataTableToolbar';
import { EmptyState } from '../EmptyState';
import { SkeletonText } from '../Skeleton';
import { Alert } from '../Alert';
import { ArrowDown, ArrowUp, ArrowUpDown, FileWarning } from 'lucide-react';

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  isLoading?: boolean;
  error?: string;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  onExport?: () => void;
  enableSelection?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  density?: 'compact' | 'normal';
  className?: string;
  /** Stable E2E selector root, e.g. data-testid="invoices-table" --
   * individual rows get `${testId}-row-${keyExtractor(row)}`. */
  'data-testid'?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading,
  error,
  onRowClick,
  searchPlaceholder,
  onExport,
  enableSelection,
  selectedIds = [],
  onSelectionChange,
  density = 'normal',
  className,
  'data-testid': testId,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(row => {
      return Object.values(row as Record<string, unknown>).some(val => 
        String(val).toLowerCase().includes(lowerSearch)
      );
    });
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey] as string | number;
      const bVal = (b as Record<string, unknown>)[sortKey] as string | number;
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === paginatedData.length && paginatedData.length > 0) {
      onSelectionChange([]);
    } else {
      onSelectionChange(paginatedData.map(keyExtractor));
    }
  };

  const toggleSelect = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const visibleColumns = columns.filter(c => !c.hidden);

  return (
    <div data-testid={testId} className={cn("flex flex-col h-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-card shadow-sm overflow-hidden", className)}>
      {(searchPlaceholder || onExport) && (
        <DataTableToolbar 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          searchPlaceholder={searchPlaceholder}
          onExport={onExport}
        />
      )}

      {error && (
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="flex-1 overflow-auto min-h-[300px] relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-900/90 backdrop-blur-[2px] shadow-[0_1px_0_var(--border)] dark:shadow-[0_1px_0_rgba(255,255,255,0.1)]">
            <tr>
              {enableSelection && (
                <th className="w-10 px-4 py-2 text-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-neutral-300 dark:border-neutral-700 bg-transparent text-accent-600 focus:ring-accent-500 cursor-pointer"
                    checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length}
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              {visibleColumns.map((col) => (
                <th 
                  key={col.key} 
                  className={cn(
                    'px-4 py-2 text-label text-neutral-500 dark:text-neutral-400 font-medium whitespace-nowrap bg-neutral-50 dark:bg-neutral-900/90',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.sortable && 'cursor-pointer select-none hover:text-neutral-900 dark:hover:text-neutral-100 group'
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={cn('flex items-center gap-1.5', col.align === 'right' && 'justify-end', col.align === 'center' && 'justify-center')}>
                    {col.header}
                    {col.sortable && (
                      <span className={cn(
                        "text-neutral-400",
                        sortKey !== col.key && "opacity-0 group-hover:opacity-100 transition-opacity"
                      )}>
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {isLoading ? (
              <tr>
                <td colSpan={visibleColumns.length + (enableSelection ? 1 : 0)} className="p-4">
                  <SkeletonText lines={5} />
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (enableSelection ? 1 : 0)}>
                  <EmptyState 
                    icon={<FileWarning size={24} />} 
                    title="No results found" 
                    description={searchTerm ? "Try adjusting your search query." : "There are no records to display."}
                    className="py-12 min-h-0"
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const id = keyExtractor(row);
                const isSelected = selectedIds.includes(id);
                return (
                  <tr
                    key={id}
                    data-testid={testId ? `${testId}-row-${id}` : undefined}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={cn(
                      'group transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                      isSelected && 'bg-accent-50 dark:bg-accent-900/20'
                    )}
                  >
                    {enableSelection && (
                      <td className="w-10 px-4 py-2 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="rounded border-neutral-300 dark:border-neutral-700 bg-transparent text-accent-600 focus:ring-accent-500 cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelect(id)}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => (
                      <td 
                        key={col.key}
                        className={cn(
                          'px-4 text-body text-neutral-900 dark:text-neutral-100 truncate',
                          density === 'compact' ? 'py-1.5' : 'py-2.5',
                          col.align === 'right' && 'text-right tabular-nums',
                          col.align === 'center' && 'text-center'
                        )}
                      >
                        {col.cell ? col.cell(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <DataTablePagination 
        page={page} 
        pageSize={pageSize} 
        total={sortedData.length} 
        onPageChange={setPage} 
        onPageSizeChange={setPageSize} 
      />
    </div>
  );
}
