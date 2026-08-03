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

interface Refund {
  id: string;
  customer_id: string;
  refund_number: string;
  payment_mode: string;
  amount_refunded: number;
  status: string;
}

const BASE = '/api/v1/omnichannel-billing/payments';

export default function PaymentsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [refundNumber, setRefundNumber] = useState('');
  const [paymentMode, setPaymentMode] = useState('BANK_TRANSFER');
  const [amount, setAmount] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiClient.get(`${BASE}/refunds`), apiClient.get('/api/v1/omnichannel-billing/customers/')])
      .then(([refundRes, custRes]) => {
        setRefunds(refundRes.data.items || []);
        setCustomers(custRes.data.items || []);
      })
      .catch(() => setError('Failed to load refunds'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || id;

  const resetForm = () => {
    setShowForm(false);
    setCustomerId('');
    setRefundNumber('');
    setPaymentMode('BANK_TRANSFER');
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`${BASE}/refunds`, {
        customer_id: customerId,
        refund_number: refundNumber,
        payment_mode: paymentMode,
        amount_refunded: parseFloat(amount) || 0,
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to initiate refund');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Refund>[] = [
    {
      key: 'refund_number',
      header: 'Refund No',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.refund_number}</span>
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
      key: 'amount_refunded',
      header: 'Amount',
      sortable: true,
      align: 'right',
      cell: (row) => formatCurrency(row.amount_refunded)
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'PROCESSED' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Payments Engine" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Initiate Refund'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Process refunds and allocations.</p>
        
        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="Initiate Refund">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      <option value="">- Select -</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </Select>
                    <Input label="Refund Number" required value={refundNumber} onChange={(e) => setRefundNumber(e.target.value)} />
                    <Select label="Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                    </Select>
                    <Input type="number" step="0.01" label="Amount" required value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Save Refund</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={refunds} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search refunds..."
          />
        </div>
      </div>
    </PageShell>
  );
}
