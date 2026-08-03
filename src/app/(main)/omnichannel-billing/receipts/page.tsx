'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Customer {
  id: string;
  name: string;
}

interface Receipt {
  id: string;
  customer_id: string;
  receipt_number: string;
  payment_mode: string;
  amount_received: number;
  unallocated_amount: number;
}

const BASE = '/api/v1/omnichannel-billing/payments';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [amount, setAmount] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiClient.get(`${BASE}/receipts`), apiClient.get('/api/v1/omnichannel-billing/customers/')])
      .then(([receiptRes, custRes]) => {
        setReceipts(receiptRes.data.items || []);
        setCustomers(custRes.data.items || []);
      })
      .catch(() => setError('Failed to load receipts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || id;

  const resetForm = () => {
    setShowForm(false);
    setCustomerId('');
    setReceiptNumber('');
    setPaymentMode('CASH');
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const amt = parseFloat(amount) || 0;
    try {
      await apiClient.post(`${BASE}/receipts`, {
        customer_id: customerId,
        receipt_number: receiptNumber,
        payment_mode: paymentMode,
        amount_received: amt,
        unallocated_amount: amt,
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to record receipt');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Receipt>[] = [
    {
      key: 'receipt_number',
      header: 'Receipt No',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.receipt_number}</span>
    },
    {
      key: 'customer_id',
      header: 'Customer',
      sortable: true,
      cell: (row) => customerName(row.customer_id)
    },
    {
      key: 'payment_mode',
      header: 'Mode',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{row.payment_mode}</span>
    },
    {
      key: 'amount_received',
      header: 'Amount',
      sortable: true,
      align: 'right',
      cell: (row) => formatCurrency(row.amount_received)
    },
    {
      key: 'unallocated_amount',
      header: 'Unallocated',
      sortable: true,
      align: 'right',
      cell: (row) => <span className="text-neutral-500">{formatCurrency(row.unallocated_amount)}</span>
    },
  ];

  return (
    <PageShell 
      title="Payment Receipts" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Record Receipt'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage incoming customer payments.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="Record New Receipt">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      <option value="">- Select -</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </Select>
                    <Input label="Receipt Number" required value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
                    <Select label="Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                      <option value="CARD">Card</option>
                    </Select>
                    <Input type="number" step="0.01" label="Amount" required value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Save Receipt</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={receipts} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search receipts..."
          />
        </div>
      </div>
    </PageShell>
  );
}
