'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, Input, Select, Alert } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Search } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface LedgerEntry {
  id: string;
  item_id: string;
  warehouse_id: string;
  quantity_before: number;
  movement_quantity: number;
  quantity_after: number;
  total_cost: number;
  reference_type: string;
  created_at: string;
}

const LEDGER_BASE = '/api/v1/universal-ledger/';

export default function LedgerDashboard() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemIdFilter, setItemIdFilter] = useState('');
  const [warehouseIdFilter, setWarehouseIdFilter] = useState('');
  const [referenceType, setReferenceType] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (itemIdFilter) params.item_id = itemIdFilter;
    if (warehouseIdFilter) params.warehouse_id = warehouseIdFilter;
    if (referenceType) params.reference_type = referenceType;
    apiClient
      .get(LEDGER_BASE, { params })
      .then((res) => setEntries(res.data.items || []))
      .catch(() => setError('Failed to load ledger'))
      .finally(() => setLoading(false));
  }, [itemIdFilter, warehouseIdFilter, referenceType]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const columns: Column<LedgerEntry>[] = [
    {
      key: 'created_at',
      header: 'Date',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{new Date(row.created_at).toLocaleString()}</span>
    },
    {
      key: 'item_id',
      header: 'Item ID',
      sortable: true,
      cell: (row) => (
        <Link href={`/universal-inventory/ledger/${row.item_id}`} className="font-mono text-accent-600 dark:text-accent-400 hover:underline">
          {row.item_id}
        </Link>
      )
    },
    {
      key: 'warehouse_id',
      header: 'Warehouse',
      sortable: true,
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{row.warehouse_id}</span>
    },
    {
      key: 'quantity_before',
      header: 'Qty Before',
      sortable: true,
      align: 'right',
      cell: (row) => <span className="text-neutral-500">{row.quantity_before}</span>
    },
    {
      key: 'movement_quantity',
      header: 'Movement',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className={`font-medium ${row.movement_quantity > 0 ? 'text-success-dark dark:text-green-500' : 'text-danger-dark dark:text-red-500'}`}>
          {row.movement_quantity > 0 ? `+${row.movement_quantity}` : row.movement_quantity}
        </span>
      )
    },
    {
      key: 'quantity_after',
      header: 'Qty After',
      sortable: true,
      align: 'right',
      cell: (row) => <span className="font-semibold text-neutral-900 dark:text-neutral-100">{row.quantity_after}</span>
    },
    {
      key: 'total_cost',
      header: 'Total Value',
      sortable: true,
      align: 'right',
      cell: (row) => <span className="text-neutral-900 dark:text-neutral-100">{formatCurrency(row.total_cost)}</span>
    },
  ];

  return (
    <PageShell title="Universal Inventory Ledger">
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Immutable stock history and valuation tracking.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 w-full">
                <Input label="Filter by Item ID" placeholder="Item ID..." value={itemIdFilter} onChange={(e) => setItemIdFilter(e.target.value)} />
              </div>
              <div className="flex-1 w-full">
                <Input label="Filter by Warehouse ID" placeholder="Warehouse ID..." value={warehouseIdFilter} onChange={(e) => setWarehouseIdFilter(e.target.value)} />
              </div>
              <div className="flex-1 w-full">
                <Select label="Reference Type" value={referenceType} onChange={(e) => setReferenceType(e.target.value)}>
                  <option value="">All Reference Types</option>
                  <option value="GRN">Goods Receipt Note</option>
                  <option value="GI">Goods Issue</option>
                  <option value="TRANSFER">Stock Transfer</option>
                  <option value="ADJUST">Adjustment</option>
                </Select>
              </div>
              <Button type="submit" variant="primary" leftIcon={<Search size={16} />}>Search</Button>
            </form>
          </CardContent>
        </Card>

        <div className="h-[600px]">
          <DataTable 
            data={entries} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search ledger..."
          />
        </div>
      </div>
    </PageShell>
  );
}
