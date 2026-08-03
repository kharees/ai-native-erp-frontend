'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Badge, Alert } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Customer {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  customer_id: string;
  invoice_number?: string;
  pi_number?: string;
  status: string;
  total_amount: string;
  _type: 'Tax' | 'Proforma';
}

const BASE = '/api/v1/omnichannel-billing/invoices';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`${BASE}/tax`),
      apiClient.get(`${BASE}/proforma`),
      apiClient.get('/api/v1/omnichannel-billing/customers/'),
      apiClient.get('/api/v1/universal-inventory/items'),
    ])
      .then(([taxRes, proformaRes, custRes, itemRes]) => {
        const tax: Invoice[] = (taxRes.data.items || []).map((i: Invoice) => ({ ...i, _type: 'Tax' as const }));
        const proforma: Invoice[] = (proformaRes.data.items || []).map((i: Invoice) => ({ ...i, _type: 'Proforma' as const }));
        setInvoices([...tax, ...proforma]);
        setCustomers(custRes.data.items || []);
        setItems(itemRes.data.items || []);
      })
      .catch(() => setError('Failed to load invoices'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || id;

  const resetForm = () => {
    setShowForm(false);
    setCustomerId('');
    setInvoiceNumber('');
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
    const lineTotal = (qty * price).toFixed(2);
    try {
      // UniversalTaxInvoiceCreate requires a non-empty items array --
      // this endpoint was previously always failing with a 422 because
      // this form sent no items at all (found while auditing the
      // frontend/backend API contract). Single-line-item form, same
      // pattern as omnichannel-billing/quotations/page.tsx's "New
      // Quotation (single line item)" form.
      await apiClient.post(`${BASE}/tax`, {
        customer_id: customerId,
        invoice_number: invoiceNumber,
        subtotal: lineTotal,
        total_amount: lineTotal,
        items: [{ item_id: itemId, quantity: qty, unit_price: price.toFixed(2), line_total: lineTotal }],
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice No',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.invoice_number || row.pi_number}</span>
    },
    {
      key: 'customer_id',
      header: 'Customer',
      sortable: true,
      cell: (row) => customerName(row.customer_id)
    },
    {
      key: '_type',
      header: 'Type',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{row._type}</span>
    },
    {
      key: 'total_amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      cell: (row) => formatCurrency(row.total_amount)
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'PAID' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Invoices Engine" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Create Invoice'}
        </Button>
      }
    >
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="New Tax Invoice (single line item)">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      <option value="">- Select -</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </Select>
                    <Input label="Invoice Number" required value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
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
                        <Button variant="primary" type="submit" isLoading={saving}>Save Invoice</Button>
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
            data-testid="invoices-table"
            data={invoices}
            columns={columns}
            keyExtractor={(row) => row.id}
            isLoading={loading}
            searchPlaceholder="Search invoices..."
          />
        </div>
      </div>
    </PageShell>
  );
}
