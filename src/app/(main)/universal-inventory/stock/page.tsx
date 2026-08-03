'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { ArrowRightLeft, X } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface LedgerEntry {
  id: string;
  item_id: string;
  warehouse_id: string;
  movement_quantity: number;
  reference_type: string;
  created_at: string;
}

const STOCK_TXN_BASE = '/api/v1/universal-warehousing/stock/transactions';
const ITEMS_BASE = '/api/v1/universal-inventory/items';
const WAREHOUSES_BASE = '/api/v1/universal-warehousing/warehouses';
const LEDGER_BASE = '/api/v1/universal-ledger/';

export default function StockMovementPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [txnType, setTxnType] = useState('IN');
  const [itemId, setItemId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [metaKey, setMetaKey] = useState('');
  const [metaValue, setMetaValue] = useState('');
  const [metadata, setMetadata] = useState<{ key: string; value: string }[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(ITEMS_BASE),
      apiClient.get(WAREHOUSES_BASE),
      apiClient.get(LEDGER_BASE),
    ])
      .then(([itemsRes, whRes, ledgerRes]) => {
        setItems(itemsRes.data.items || []);
        setWarehouses(whRes.data.items || []);
        setEntries(ledgerRes.data.items || []);
      })
      .catch(() => setError('Failed to load stock data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const itemLabel = (id: string) => items.find((i) => i.id === id)?.name || id;
  const warehouseLabel = (id: string) => warehouses.find((w) => w.id === id)?.name || id;

  const addMetadata = () => {
    if (!metaKey.trim()) return;
    setMetadata((prev) => [...prev, { key: metaKey.trim(), value: metaValue.trim() }]);
    setMetaKey('');
    setMetaValue('');
  };

  const removeMetadata = (key: string) => {
    setMetadata((prev) => prev.filter((m) => m.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(STOCK_TXN_BASE, {
        item_id: itemId,
        warehouse_id: warehouseId,
        transaction_type: txnType,
        reference_type: txnType === 'IN' ? 'GRN' : txnType === 'OUT' ? 'GI' : txnType,
        quantity: parseFloat(quantity),
        metadata: Object.fromEntries(metadata.map((m) => [m.key, m.value])),
      });
      setItemId('');
      setWarehouseId('');
      setQuantity('');
      setMetadata([]);
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to execute movement');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<LedgerEntry>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{new Date(row.created_at).toLocaleString()}</span>
    },
    {
      key: 'reference_type',
      header: 'Type',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.reference_type === 'GRN' ? 'success' : row.reference_type === 'GI' ? 'danger' : 'neutral'}>
          {row.reference_type}
        </Badge>
      )
    },
    {
      key: 'item_id',
      header: 'Item',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{itemLabel(row.item_id)}</span>
    },
    {
      key: 'movement_quantity',
      header: 'Qty',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className={`font-medium ${row.movement_quantity > 0 ? 'text-success-dark dark:text-green-500' : 'text-danger-dark dark:text-red-500'}`}>
          {row.movement_quantity > 0 ? `+${row.movement_quantity}` : row.movement_quantity}
        </span>
      )
    },
    {
      key: 'warehouse_id',
      header: 'Warehouse',
      sortable: true,
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{warehouseLabel(row.warehouse_id)}</span>
    },
  ];

  return (
    <PageShell title="Universal Stock Engine">
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Execute multi-warehouse inventory movements.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <FormSection title="New Transaction">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select label="Transaction Type" value={txnType} onChange={(e) => setTxnType(e.target.value)}>
                      <option value="IN">Stock In (GRN)</option>
                      <option value="OUT">Stock Out (GI)</option>
                      <option value="TRANSFER">Transfer</option>
                      <option value="ADJUST">Adjustment</option>
                    </Select>
                    <Select label="Warehouse" required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                      <option value="">Select Warehouse...</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                    <Select label="Item" required value={itemId} onChange={(e) => setItemId(e.target.value)}>
                      <option value="">Select Item...</option>
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                      ))}
                    </Select>
                    <Input type="number" label="Quantity" required min="0.0001" step="0.0001" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </div>

                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Dynamic Transaction Metadata</h3>
                    <p className="text-caption text-neutral-500 mb-4">Attach schema-less metadata directly to this movement (e.g., Driver Name, Vehicle Number, Supplier Batch ID).</p>

                    {metadata.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {metadata.map((m) => (
                          <Badge key={m.key} variant="neutral" className="flex items-center gap-1 text-sm py-1.5 px-3">
                            <span className="font-semibold">{m.key}:</span> {m.value}
                            <button type="button" onClick={() => removeMetadata(m.key)} className="ml-1 text-neutral-400 hover:text-danger-dark dark:hover:text-red-500">
                              <X size={14} />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 items-end bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <Input label="Metadata Key" placeholder="e.g. Driver Name" value={metaKey} onChange={(e) => setMetaKey(e.target.value)} />
                      <Input label="Value" placeholder="e.g. John Doe" value={metaValue} onChange={(e) => setMetaValue(e.target.value)} />
                      <Button type="button" variant="secondary" onClick={addMetadata} disabled={!metaKey.trim()}>Add</Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800">
                    <Button variant="primary" type="submit" isLoading={saving} leftIcon={<ArrowRightLeft size={16} />}>
                      Execute Movement
                    </Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        </div>

        <div className="h-[600px] pt-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Recent Transactions</h2>
          <DataTable 
            data={entries} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search transactions..."
          />
        </div>
      </div>
    </PageShell>
  );
}
