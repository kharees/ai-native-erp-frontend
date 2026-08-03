'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
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

interface Note {
  id: string;
  customer_id: string;
  note_number: string;
  status: string;
  total_amount: number;
  _type: 'Credit' | 'Debit';
}

const BASE = '/api/v1/omnichannel-billing/returns';

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [noteType, setNoteType] = useState<'credit' | 'debit'>('credit');
  const [customerId, setCustomerId] = useState('');
  const [noteNumber, setNoteNumber] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`${BASE}/credit-notes`),
      apiClient.get(`${BASE}/debit-notes`),
      apiClient.get('/api/v1/omnichannel-billing/customers/'),
      apiClient.get('/api/v1/universal-inventory/items'),
    ])
      .then(([creditRes, debitRes, custRes, itemRes]) => {
        const credit: Note[] = (creditRes.data.items || []).map((n: Note) => ({ ...n, _type: 'Credit' as const }));
        const debit: Note[] = (debitRes.data.items || []).map((n: Note) => ({ ...n, _type: 'Debit' as const }));
        setNotes([...credit, ...debit]);
        setCustomers(custRes.data.items || []);
        setItems(itemRes.data.items || []);
      })
      .catch(() => setError('Failed to load notes'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || id;

  const resetForm = () => {
    setShowForm(false);
    setCustomerId('');
    setNoteNumber('');
    setItemId('');
    setQuantity('1');
    setUnitPrice('');
    setReason('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const lineTotal = qty * price;
    try {
      await apiClient.post(`${BASE}/${noteType}-notes`, {
        customer_id: customerId,
        note_number: noteNumber,
        reason: reason || null,
        total_amount: lineTotal,
        items: [{ item_id: itemId, quantity: qty, unit_price: price, line_total: lineTotal }],
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to issue note');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Note>[] = [
    {
      key: 'note_number',
      header: 'Note No',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.note_number}</span>
    },
    {
      key: '_type',
      header: 'Type',
      sortable: true,
      cell: (row) => (
        <Badge variant={row._type === 'Credit' ? 'success' : 'danger'}>
          {row._type} Note
        </Badge>
      )
    },
    {
      key: 'customer_id',
      header: 'Customer',
      sortable: true,
      cell: (row) => customerName(row.customer_id)
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
        <Badge variant="neutral">
          {row.status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Credit & Debit Notes" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Issue Note'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage financial adjustments and returns.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="Issue New Note">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Type" value={noteType} onChange={(e) => setNoteType(e.target.value as 'credit' | 'debit')}>
                      <option value="credit">Credit Note</option>
                      <option value="debit">Debit Note</option>
                    </Select>
                    <Select label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      <option value="">- Select -</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </Select>
                    <Input label="Note Number" required value={noteNumber} onChange={(e) => setNoteNumber(e.target.value)} />
                  </FormRow>
                  <FormRow>
                    <Select label="Item" required value={itemId} onChange={(e) => setItemId(e.target.value)}>
                      <option value="">- Select -</option>
                      {items.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                    </Select>
                    <Input type="number" step="0.01" label="Quantity" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    <Input type="number" step="0.01" label="Unit Price" required value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
                  </FormRow>
                  <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} className="max-w-2xl" />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Save Note</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={notes} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search notes..."
          />
        </div>
      </div>
    </PageShell>
  );
}
