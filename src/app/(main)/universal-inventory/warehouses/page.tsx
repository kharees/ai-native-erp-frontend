'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCrudResource } from '@/hooks/useCrudResource';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus } from 'lucide-react';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string | null;
  status: string;
  capacity_sqft: number;
  is_active: boolean;
}

const BASE = '/api/v1/universal-warehousing/warehouses';

export default function WarehousesDashboard() {
  const { data: warehouses, loading, error, saving, create } = useCrudResource<Warehouse>(BASE);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('main');
  const [capacitySqft, setCapacitySqft] = useState('0');

  const resetForm = () => {
    setShowForm(false);
    setCode('');
    setName('');
    setType('main');
    setCapacitySqft('0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await create({ code, name, type, capacity_sqft: parseFloat(capacitySqft) || 0 });
    if (ok) resetForm();
  };

  const columns: Column<Warehouse>[] = [
    {
      key: 'code',
      header: 'Warehouse Code',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.code}</span>
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</span>
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      cell: (row) => <span className="text-neutral-500 capitalize">{row.type || '-'}</span>
    },
    {
      key: 'capacity_sqft',
      header: 'Capacity',
      sortable: true,
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{row.capacity_sqft} sqft</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'active' || row.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Universal Warehousing" 
      actions={
        <div className="flex gap-2">
          <Link href="/universal-inventory/warehouses/bins">
            <Button variant="secondary">Manage Bins</Button>
          </Link>
          <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
            {showForm ? 'Cancel' : 'Create Warehouse'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Configure and manage warehouse locations across the enterprise.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="Create New Warehouse">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Input label="Code" required value={code} onChange={(e) => setCode(e.target.value)} />
                    <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <Select label="Type" required value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="main">Main</option>
                      <option value="transit">Transit</option>
                      <option value="virtual">Virtual</option>
                    </Select>
                    <Input type="number" step="0.01" label="Capacity (sqft)" value={capacitySqft} onChange={(e) => setCapacitySqft(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Save Warehouse</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={warehouses} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search warehouses..."
          />
        </div>
      </div>
    </PageShell>
  );
}
