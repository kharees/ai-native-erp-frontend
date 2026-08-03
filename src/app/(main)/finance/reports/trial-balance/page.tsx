'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { PageShell, DataTable, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/formatCurrency';

interface TrialBalanceLine {
  account_code: string;
  account_name: string;
  account_type: string;
  closing_debit: number;
  closing_credit: number;
}

interface TrialBalanceReport {
  lines: TrialBalanceLine[];
  total_debit: number;
  total_credit: number;
}

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/v1/finance-reports/trial-balance')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load trial balance'))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<TrialBalanceLine>[] = [
    {
      key: 'account_code',
      header: 'Account Code',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.account_code}</span>
    },
    {
      key: 'account_name',
      header: 'Account Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.account_name}</span>
    },
    {
      key: 'account_type',
      header: 'Type',
      sortable: true,
      cell: (row) => <span className="text-neutral-500 capitalize">{row.account_type}</span>
    },
    {
      key: 'closing_debit',
      header: 'Debit Balance',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
          {row.closing_debit > 0 ? formatCurrency(row.closing_debit) : '-'}
        </span>
      )
    },
    {
      key: 'closing_credit',
      header: 'Credit Balance',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
          {row.closing_credit > 0 ? formatCurrency(row.closing_credit) : '-'}
        </span>
      )
    },
  ];

  return (
    <PageShell title="Trial Balance" actions={<Badge variant="neutral">Real-time ledger aggregation</Badge>}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Validate the equality of total debits and credits across all ledger accounts.</p>

        {error && <Alert variant="error">{error}</Alert>}
        
        {loading && !data ? (
          <div className="text-neutral-500">Loading statement...</div>
        ) : data ? (
          <div className="space-y-4">
            <div className="h-[600px]">
              <DataTable 
                data={data.lines} 
                columns={columns} 
                keyExtractor={(row) => row.account_code} 
                isLoading={loading}
                searchPlaceholder="Search accounts..."
              />
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-lg p-6 border border-neutral-200 dark:border-neutral-800 flex justify-end gap-12 font-bold text-lg">
              <span className="text-neutral-900 dark:text-neutral-100">Totals:</span>
              <span className="text-success-dark dark:text-green-500 w-32 text-right">{formatCurrency(data.total_debit)}</span>
              <span className="text-success-dark dark:text-green-500 w-32 text-right">{formatCurrency(data.total_credit)}</span>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
