'use client';

import { useState } from 'react';
import { useCrudResource } from '@/hooks/useCrudResource';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus } from 'lucide-react';

interface TaxConfig {
  id: string;
  name: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  is_active: boolean;
}

const BASE = '/api/v1/omnichannel-billing/taxes/configurations';

export default function TaxesPage() {
  const { data: configs, loading, error, saving, create } = useCrudResource<TaxConfig>(BASE);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cgst, setCgst] = useState('0');
  const [sgst, setSgst] = useState('0');
  const [igst, setIgst] = useState('0');

  const resetForm = () => {
    setShowForm(false);
    setName('');
    setCgst('0');
    setSgst('0');
    setIgst('0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await create({
      name,
      cgst_rate: parseFloat(cgst) || 0,
      sgst_rate: parseFloat(sgst) || 0,
      igst_rate: parseFloat(igst) || 0,
    });
    if (ok) resetForm();
  };

  const columns: Column<TaxConfig>[] = [
    {
      key: 'name',
      header: 'Configuration Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</span>
    },
    {
      key: 'cgst_rate',
      header: 'CGST %',
      sortable: true,
      align: 'right',
      cell: (row) => `${row.cgst_rate}%`
    },
    {
      key: 'sgst_rate',
      header: 'SGST %',
      sortable: true,
      align: 'right',
      cell: (row) => `${row.sgst_rate}%`
    },
    {
      key: 'igst_rate',
      header: 'IGST %',
      sortable: true,
      align: 'right',
      cell: (row) => `${row.igst_rate}%`
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Tax & GST Engine" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Add Configuration'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Configure Tax Rates for transactions.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="New Tax Configuration">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <Input type="number" step="0.01" label="CGST %" value={cgst} onChange={(e) => setCgst(e.target.value)} />
                    <Input type="number" step="0.01" label="SGST %" value={sgst} onChange={(e) => setSgst(e.target.value)} />
                    <Input type="number" step="0.01" label="IGST %" value={igst} onChange={(e) => setIgst(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Save Configuration</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={configs} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search configurations..."
          />
        </div>
      </div>
    </PageShell>
  );
}
