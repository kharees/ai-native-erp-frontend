'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

interface Challan {
  id: string;
  customer_id: string;
  challan_number: string;
  status: string;
  dispatch_date: string | null;
}

const BASE = '/api/v1/omnichannel-billing/documents';

export default function FulfillmentPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`${BASE}/delivery-challans`),
      apiClient.get('/api/v1/omnichannel-billing/customers/'),
      apiClient.get('/api/v1/universal-inventory/items'),
    ])
      .then(([challanRes, custRes, itemRes]) => {
        setChallans(challanRes.data.items || []);
        setCustomers(custRes.data.items || []);
        setItems(itemRes.data.items || []);
      })
      .catch(() => setError('Failed to load fulfillment documents'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || id;

  const resetForm = () => {
    setShowForm(false);
    setCustomerId('');
    setChallanNumber('');
    setItemId('');
    setQuantity('1');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`${BASE}/delivery-challans`, {
        customer_id: customerId,
        challan_number: challanNumber,
        items: [{ item_id: itemId, quantity_dispatched: parseFloat(quantity) }],
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create delivery challan');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Challan>[] = [
    {
      key: 'challan_number',
      header: 'Document No',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.challan_number}</span>
    },
    {
      key: 'customer_id',
      header: 'Customer',
      sortable: true,
      cell: (row) => customerName(row.customer_id)
    },
    {
      key: 'dispatch_date',
      header: 'Dispatch Date',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{row.dispatch_date ? new Date(row.dispatch_date).toLocaleDateString() : '-'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'DISPATCHED' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Fulfillment Engine" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Create Document'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage Delivery Challans.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="New Delivery Challan">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      <option value="">- Select -</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </Select>
                    <Input label="Challan Number" required value={challanNumber} onChange={(e) => setChallanNumber(e.target.value)} />
                    <Select label="Item" required value={itemId} onChange={(e) => setItemId(e.target.value)}>
                      <option value="">- Select -</option>
                      {items.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                    </Select>
                    <Input type="number" step="0.01" label="Quantity" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Save Challan</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={challans} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search challans..."
          />
        </div>
      </div>
    </PageShell>
  );
}
