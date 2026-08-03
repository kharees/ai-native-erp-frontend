'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { PageShell, Card, CardContent, Alert, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';

interface CategoryLine {
  category_name: string;
  amount: number;
}

interface BalanceSheetReport {
  assets: CategoryLine[];
  total_assets: number;
  liabilities: CategoryLine[];
  total_liabilities: number;
  equity: CategoryLine[];
  total_equity: number;
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/v1/finance-reports/balance-sheet')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load balance sheet'))
      .finally(() => setLoading(false));
  }, []);

  const renderSection = (title: string, lines: CategoryLine[], totalTitle: string, totalAmount: number) => (
    <Card className="mb-6 overflow-hidden">
      <div className="bg-neutral-50 dark:bg-neutral-900/50 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {lines.length === 0 ? (
            <p className="text-sm text-neutral-400 p-6 text-center italic">No entries.</p>
          ) : lines.map((line, idx) => (
            <div key={idx} className="flex justify-between px-6 py-3 text-body text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
              <span>{line.category_name}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(line.amount)}</span>
            </div>
          ))}
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-900/80 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between font-semibold text-neutral-900 dark:text-neutral-100">
          <span>{totalTitle}</span>
          <span>{formatCurrency(totalAmount)}</span>
        </div>
      </CardContent>
    </Card>
  );

  const balances = data ? Number(data.total_assets) === Number(data.total_liabilities) + Number(data.total_equity) : true;

  return (
    <PageShell title="Balance Sheet" actions={<Badge variant="neutral">As of Today</Badge>}>
      <div className="space-y-6 max-w-6xl mx-auto">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Statement of financial position detailing assets, liabilities, and equity.</p>

        {error && <Alert variant="error">{error}</Alert>}
        
        {loading && !data ? (
          <div className="text-neutral-500">Loading statement...</div>
        ) : data ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {renderSection('Assets', data.assets, 'Total Assets', data.total_assets)}
            </div>
            <div>
              {renderSection('Liabilities', data.liabilities, 'Total Liabilities', data.total_liabilities)}
              {renderSection('Equity', data.equity, 'Total Equity', data.total_equity)}

              <Card className={balances ? 'bg-success-light/20 border-success-light dark:bg-green-950/30 dark:border-green-900' : 'bg-danger-light/20 border-danger-light dark:bg-red-950/30 dark:border-red-900'}>
                <CardContent className="p-6 flex justify-between items-center font-bold text-lg">
                  <span className={balances ? 'text-success-dark dark:text-green-500' : 'text-danger-dark dark:text-red-500'}>
                    Total Liabilities & Equity
                  </span>
                  <span className={balances ? 'text-success-dark dark:text-green-500' : 'text-danger-dark dark:text-red-500'}>
                    {formatCurrency(Number(data.total_liabilities) + Number(data.total_equity))}
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
