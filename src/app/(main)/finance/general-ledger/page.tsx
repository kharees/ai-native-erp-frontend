'use client';

import { useEffect, useState, useMemo } from 'react';
import apiClient from '@/lib/apiClient';
import { PageShell, DataTable, Select, Alert, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';
import { Column } from '@/components/ui/DataTable';

interface Account {
  id: string;
  account_code: string;
  name: string;
}

interface Line {
  id: string;
  account_id: string;
  debit: number;
  credit: number;
  description: string | null;
}

interface Voucher {
  id: string;
  voucher_number: string;
  entry_date: string;
  reference: string | null;
  status: string;
  lines: Line[];
}

interface EntryRow {
  id: string;
  date: string;
  account_id: string;
  description: string;
  debit: number;
  credit: number;
  status: string;
}

export default function GeneralLedgerPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/v1/finance-core/journals'),
      apiClient.get('/api/v1/finance-core/accounts'),
    ])
      .then(([voucherRes, accountRes]) => {
        setVouchers(voucherRes.data || []);
        setAccounts(accountRes.data || []);
      })
      .catch(() => setError('Failed to load general ledger'))
      .finally(() => setLoading(false));
  }, []);

  const accountLabel = (id: string) => {
    const a = accounts.find((acc) => acc.id === id);
    return a ? `${a.name} (${a.account_code})` : id;
  };

  const entries = useMemo(() => {
    const rows: EntryRow[] = [];
    for (const v of vouchers) {
      for (const line of v.lines) {
        rows.push({
          id: line.id,
          date: v.entry_date,
          account_id: line.account_id,
          description: line.description || v.reference || v.voucher_number,
          debit: Number(line.debit),
          credit: Number(line.credit),
          status: v.status,
        });
      }
    }
    return rows
      .filter((r) => selectedAccount === 'all' || r.account_id === selectedAccount)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [vouchers, selectedAccount]);

  const columns: Column<EntryRow>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{new Date(row.date).toLocaleDateString()}</span>
    },
    {
      key: 'account_id',
      header: 'Account',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{accountLabel(row.account_id)}</span>
    },
    {
      key: 'description',
      header: 'Description',
      cell: (row) => <span className="text-neutral-600 dark:text-neutral-400">{row.description}</span>
    },
    {
      key: 'debit',
      header: 'Debit',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
          {row.debit > 0 ? formatCurrency(row.debit) : '-'}
        </span>
      )
    },
    {
      key: 'credit',
      header: 'Credit',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
          {row.credit > 0 ? formatCurrency(row.credit) : '-'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'posted' || row.status === 'POSTED' ? 'success' : row.status === 'draft' ? 'neutral' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell title="General Ledger">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <p className="text-body text-neutral-500 dark:text-neutral-400">View detailed transactions for all accounts.</p>
          <div className="w-full sm:w-64">
            <Select
              label=""
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="all">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.account_code})</option>
              ))}
            </Select>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="h-[600px]">
          <DataTable 
            data={entries} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search description or amount..."
          />
        </div>
      </div>
    </PageShell>
  );
}
