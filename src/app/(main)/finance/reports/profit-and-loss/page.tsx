'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { PageShell, Card, CardContent, Alert, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';

interface CategoryLine {
  category_name: string;
  amount: number;
}

interface PLReport {
  revenue: CategoryLine[];
  cogs: CategoryLine[];
  gross_profit: number;
  operating_expenses: CategoryLine[];
  operating_profit: number;
  net_profit: number;
}

export default function ProfitAndLossPage() {
  const [data, setData] = useState<PLReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/v1/finance-reports/profit-and-loss')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load profit & loss statement'))
      .finally(() => setLoading(false));
  }, []);

  const renderSection = (title: string, lines: CategoryLine[], totalAmount: number) => (
    <div className="mb-6">
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-2 px-2">{title}</h3>
      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
        {lines.length === 0 ? (
          <p className="text-sm text-neutral-400 py-3 px-4 italic">No entries.</p>
        ) : lines.map((line, idx) => (
          <div key={idx} className="flex justify-between py-2.5 px-4 text-body text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
            <span>{line.category_name}</span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(line.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100 border-t border-neutral-200 dark:border-neutral-800 mt-2">
        <span>Total {title}</span>
        <span>{formatCurrency(totalAmount)}</span>
      </div>
    </div>
  );

  return (
    <PageShell title="Profit & Loss Statement" actions={<Badge variant="neutral">Year to Date</Badge>}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Income statement reflecting revenues, costs, and expenses.</p>

        {error && <Alert variant="error">{error}</Alert>}
        
        {loading && !data ? (
          <div className="text-neutral-500">Loading statement...</div>
        ) : data ? (
          <Card>
            <CardContent className="p-8">
              {renderSection('Revenue', data.revenue, data.revenue.reduce((acc, v) => acc + Number(v.amount), 0))}
              {renderSection('Cost of Goods Sold (COGS)', data.cogs, data.cogs.reduce((acc, v) => acc + Number(v.amount), 0))}

              <div className="flex justify-between py-4 px-6 font-bold text-lg bg-success-light/10 text-success-dark dark:bg-green-950/20 dark:text-green-500 rounded-lg mb-8">
                <span>Gross Profit</span>
                <span>{formatCurrency(data.gross_profit)}</span>
              </div>

              {renderSection('Operating Expenses', data.operating_expenses, data.operating_expenses.reduce((acc, v) => acc + Number(v.amount), 0))}

              <div className="flex justify-between py-4 px-6 font-bold text-xl bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-400 rounded-lg mt-8 border-t-2 border-accent-200 dark:border-accent-900">
                <span>Net Profit</span>
                <span>{formatCurrency(data.net_profit)}</span>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageShell>
  );
}
