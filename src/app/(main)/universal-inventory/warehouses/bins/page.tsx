'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus } from 'lucide-react';

interface Warehouse {
  id: string;
  name: string;
}

interface Bin {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  aisle: string | null;
  rack: string | null;
  shelf: string | null;
  max_weight: number;
  max_volume: number;
}

const BINS_BASE = '/api/v1/universal-warehousing/bins';
const WAREHOUSES_BASE = '/api/v1/universal-warehousing/warehouses';

export default function BinsPage() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [warehouseId, setWarehouseId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [aisle, setAisle] = useState('');
  const [rack, setRack] = useState('');
  const [shelf, setShelf] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiClient.get(BINS_BASE), apiClient.get(WAREHOUSES_BASE)])
      .then(([binsRes, whRes]) => {
        setBins(binsRes.data.items || []);
        setWarehouses(whRes.data.items || []);
      })
      .catch(() => setError('Failed to load bins'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name || '-';

  const resetForm = () => {
    setShowForm(false);
    setWarehouseId('');
    setCode('');
    setName('');
    setAisle('');
    setRack('');
    setShelf('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(BINS_BASE, {
        warehouse_id: warehouseId,
        code,
        name,
        aisle: aisle || null,
        rack: rack || null,
        shelf: shelf || null,
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create bin');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Bin>[] = [
    {
      key: 'code',
      header: 'Bin Code',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.code}</span>
    },
    {
      key: 'warehouse_id',
      header: 'Warehouse',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{warehouseName(row.warehouse_id)}</span>
    },
    {
      key: 'location',
      header: 'Aisle/Rack/Shelf',
      cell: (row) => <span className="text-neutral-500">{[row.aisle, row.rack, row.shelf].filter(Boolean).join(' / ') || '-'}</span>
    },
    {
      key: 'capacity',
      header: 'Capacity Metrics',
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{row.max_weight}kg / {row.max_volume}m³</span>
    },
  ];

  return (
    <PageShell 
      title="Bin Management" 
      actions={
        <div className="flex gap-2">
          <Link href="/universal-inventory/warehouses">
            <Button variant="outline">Back to Warehouses</Button>
          </Link>
          <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
            {showForm ? 'Cancel' : 'Create Bin'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Configure micro-locations using flat dimensional attributes.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="Create New Bin">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Warehouse" required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                      <option value="">- Select -</option>
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </Select>
                    <Input label="Bin Code" required value={code} onChange={(e) => setCode(e.target.value)} />
                    <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                  </FormRow>
                  <FormRow>
                    <Input label="Aisle" value={aisle} onChange={(e) => setAisle(e.target.value)} />
                    <Input label="Rack" value={rack} onChange={(e) => setRack(e.target.value)} />
                    <Input label="Shelf" value={shelf} onChange={(e) => setShelf(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Save Bin</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={bins} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search bins..."
          />
        </div>
      </div>
    </PageShell>
  );
}
