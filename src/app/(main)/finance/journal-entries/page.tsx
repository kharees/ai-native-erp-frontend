'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';

import { Column } from '@/components/ui/DataTable';
import { Plus, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Account {
  id: string;
  account_code: string;
  name: string;
}

interface Voucher {
  id: string;
  voucher_number: string;
  entry_date: string;
  reference: string | null;
  status: string;
  total_debit: number;
}

const JOURNALS_BASE = '/api/v1/finance-core/journal-vouchers';
const JOURNALS_LIST = '/api/v1/finance-core/journals';
const ACCOUNTS_BASE = '/api/v1/finance-core/accounts';

export default function JournalEntriesPage() {
  const tenantId = useAuthStore((s) => s.user?.tenant_id);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [voucherNumber, setVoucherNumber] = useState('');
  const [reference, setReference] = useState('');
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [amount, setAmount] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiClient.get(JOURNALS_LIST), apiClient.get(ACCOUNTS_BASE)])
      .then(([voucherRes, accountRes]) => {
        setVouchers(voucherRes.data || []);
        setAccounts(accountRes.data || []);
      })
      .catch(() => setError('Failed to load journal entries'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setShowForm(false);
    setVoucherNumber('');
    setReference('');
    setDebitAccountId('');
    setCreditAccountId('');
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError('');
    const amt = parseFloat(amount) || 0;
    try {
      await apiClient.post(JOURNALS_BASE, {
        tenant_id: tenantId,
        voucher_number: voucherNumber,
        reference: reference || null,
        entry_date: new Date().toISOString(),
        lines: [
          { account_id: debitAccountId, debit: amt, credit: 0 },
          { account_id: creditAccountId, debit: 0, credit: amt },
        ],
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create journal voucher');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    setError('');
    try {
      await apiClient.post(`${JOURNALS_LIST}/${id}/approve`);
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to approve voucher');
    }
  };

  const columns: Column<Voucher>[] = [
    {
      key: 'voucher_number',
      header: 'Voucher #',
      sortable: true,
      cell: (row) => <span className="font-mono text-accent-600 dark:text-accent-400 font-medium">{row.voucher_number}</span>
    },
    {
      key: 'entry_date',
      header: 'Date',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{new Date(row.entry_date).toLocaleDateString()}</span>
    },
    {
      key: 'reference',
      header: 'Reference',
      sortable: true,
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{row.reference || '-'}</span>
    },
    {
      key: 'total_debit',
      header: 'Total Amount',
      sortable: true,
      align: 'right',
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(row.total_debit)}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'posted' ? 'success' : row.status === 'draft' ? 'neutral' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        row.status !== 'posted' ? (
          <Button variant="ghost" size="sm" className="text-success-dark dark:text-green-500" onClick={() => handleApprove(row.id)} leftIcon={<CheckCircle size={14} />}>
            Approve
          </Button>
        ) : (
          <span className="text-neutral-400">-</span>
        )
      )
    },
  ];

  return (
    <PageShell 
      title="Journal Entries" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Create Journal Entry'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage manual double-entry journals and vouchers.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="New Journal Voucher (Simple Double-Entry)">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Input label="Voucher Number" required value={voucherNumber} onChange={(e) => setVoucherNumber(e.target.value)} />
                    <Input label="Reference" value={reference} onChange={(e) => setReference(e.target.value)} />
                    <Input type="number" step="0.01" label="Amount" required value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </FormRow>
                  <FormRow>
                    <Select label="Debit Account" required value={debitAccountId} onChange={(e) => setDebitAccountId(e.target.value)}>
                      <option value="">- Select -</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.account_code} - {a.name}</option>
                      ))}
                    </Select>
                    <Select label="Credit Account" required value={creditAccountId} onChange={(e) => setCreditAccountId(e.target.value)}>
                      <option value="">- Select -</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.account_code} - {a.name}</option>
                      ))}
                    </Select>
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving} disabled={!tenantId}>Post Voucher</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={vouchers} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search journals..."
          />
        </div>
      </div>
    </PageShell>
  );
}
