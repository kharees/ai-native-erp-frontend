'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { quotationService } from '@/services/quotationService';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/formatCurrency';

interface Customer {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

interface Quotation {
  id: string;
  customer_id: string;
  quotation_number: string;
  status: string;
  valid_until: string | null;
  total_amount: string;
  revision_number: number;
}

const BASE = '/api/v1/omnichannel-billing/sales';

function getStatusProps(q: Quotation): { label: string; variant: 'success' | 'danger' | 'neutral' | 'accent' | 'warning' } {
  if (q.status === 'CONVERTED') {
    return { label: 'Converted to Invoice', variant: 'success' };
  }
  if (q.valid_until && new Date(q.valid_until) < new Date()) {
    return { label: 'Expired', variant: 'neutral' };
  }
  return { label: q.status === 'DRAFT' ? 'Draft' : q.status, variant: 'accent' };
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [photoOriginatedIds, setPhotoOriginatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [quotationNumber, setQuotationNumber] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`${BASE}/quotations`),
      apiClient.get('/api/v1/omnichannel-billing/customers/'),
      apiClient.get('/api/v1/universal-inventory/items'),
    ])
      .then(([quoteRes, custRes, itemRes]) => {
        setQuotations(quoteRes.data.items || []);
        setCustomers(custRes.data.items || []);
        setItems(itemRes.data.items || []);
      })
      .catch(() => setError('Failed to load quotations'))
      .finally(() => setLoading(false));
    quotationService
      .getPhotoOriginatedQuotationIds()
      .then((ids) => setPhotoOriginatedIds(new Set(ids)))
      .catch(() => setPhotoOriginatedIds(new Set()));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || id;

  const resetForm = () => {
    setShowForm(false);
    setCustomerId('');
    setQuotationNumber('');
    setItemId('');
    setQuantity('1');
    setUnitPrice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    try {
      await apiClient.post(`${BASE}/quotations`, {
        customer_id: customerId,
        quotation_number: quotationNumber,
        total_amount: (qty * price).toFixed(2),
        items: [{ item_id: itemId, quantity: qty, unit_price: price.toFixed(2) }],
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create quotation');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Quotation>[] = [
    {
      key: 'quotation_number',
      header: 'Quotation No',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link href={`/omnichannel-billing/quotations/${row.id}`} className="font-mono text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 hover:underline">
            {row.quotation_number}
          </Link>
          {photoOriginatedIds.has(row.id) && (
            <Badge variant="accent" className="text-[10px] px-1.5 py-0">via photo</Badge>
          )}
        </div>
      )
    },
    {
      key: 'customer_id',
      header: 'Customer',
      sortable: true,
      cell: (row) => customerName(row.customer_id)
    },
    {
      key: 'revision_number',
      header: 'Revision',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">v{row.revision_number}</span>
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      align: 'right',
      cell: (row) => formatCurrency(row.total_amount)
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => {
        const { label, variant } = getStatusProps(row);
        return <Badge variant={variant}>{label}</Badge>;
      }
    },
  ];

  return (
    <PageShell 
      title="Sales Quotations" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'New Quotation'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Create and track quotation revisions.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="New Quotation (single line item)">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      <option value="">- Select -</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </Select>
                    <Input label="Quotation No" required value={quotationNumber} onChange={(e) => setQuotationNumber(e.target.value)} />
                    <Select label="Item" required value={itemId} onChange={(e) => setItemId(e.target.value)}>
                      <option value="">- Select -</option>
                      {items.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                    </Select>
                  </FormRow>
                  <FormRow>
                    <Input type="number" step="0.01" label="Quantity" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    <Input type="number" step="0.01" label="Unit Price" required value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
                    <div className="flex items-end justify-end w-full">
                      <div className="flex gap-2">
                        <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                        <Button variant="primary" type="submit" isLoading={saving}>Save Quotation</Button>
                      </div>
                    </div>
                  </FormRow>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={quotations} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search quotations..."
          />
        </div>
      </div>
    </PageShell>
  );
}
