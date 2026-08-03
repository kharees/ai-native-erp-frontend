import React from 'react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  hidden?: boolean;
}
