'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { PageShell, Card, CardContent, Alert, Badge } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';

interface CashFlowLine {
  description: string;
  amount: number;
}

interface CashFlowReport {
  operating_activities: CashFlowLine[];
  net_operating_cash: number;
  investing_activities: CashFlowLine[];
  net_investing_cash: number;
  financing_activities: CashFlowLine[];
  net_financing_cash: number;
  net_cash_increase: number;
  opening_cash_balance: number;
  closing_cash_balance: number;
}

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowReport | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/api/v1/finance-reports/cash-flow')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load cash flow statement'))
      .finally(() => setLoading(false));
  }, []);

  const renderSection = (title: string, lines: CashFlowLine[], totalTitle: string, totalAmount: number) => (
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
              <span>{line.description}</span>
              <span className={Number(line.amount) < 0 ? 'text-danger-dark dark:text-red-500 font-medium' : 'text-neutral-900 dark:text-neutral-100 font-medium'}>
                {Number(line.amount) < 0 ? `(${formatCurrency(Math.abs(Number(line.amount)))})` : formatCurrency(line.amount)}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-neutral-50 dark:bg-neutral-900/80 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-between font-semibold text-neutral-900 dark:text-neutral-100">
          <span>{totalTitle}</span>
          <span className={Number(totalAmount) < 0 ? 'text-danger-dark dark:text-red-500' : 'text-neutral-900 dark:text-neutral-100'}>
            {Number(totalAmount) < 0 ? `(${formatCurrency(Math.abs(Number(totalAmount)))})` : formatCurrency(totalAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PageShell title="Statement of Cash Flows" actions={<Badge variant="neutral">Indirect Method</Badge>}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Cash inflows and outflows from operating, investing, and financing activities.</p>

        {error && <Alert variant="error">{error}</Alert>}
        
        {loading && !data ? (
          <div className="text-neutral-500">Loading statement...</div>
        ) : data ? (
          <>
            <Card className="bg-accent-50/50 border-accent-200 dark:bg-accent-950/20 dark:border-accent-900 mb-6">
              <CardContent className="p-6 flex justify-between items-center font-bold text-lg">
                <span className="text-accent-700 dark:text-accent-400">Opening Cash Balance</span>
                <span className="text-accent-700 dark:text-accent-400">{formatCurrency(data.opening_cash_balance)}</span>
              </CardContent>
            </Card>

            {renderSection('Operating Activities', data.operating_activities, 'Net Cash from Operating Activities', data.net_operating_cash)}
            {renderSection('Investing Activities', data.investing_activities, 'Net Cash from Investing Activities', data.net_investing_cash)}
            {renderSection('Financing Activities', data.financing_activities, 'Net Cash from Financing Activities', data.net_financing_cash)}

            <Card className="bg-success-light/20 border-success-light dark:bg-green-950/30 dark:border-green-900 mt-6">
              <CardContent className="p-6 flex justify-between items-center font-bold text-lg">
                <span className="text-success-dark dark:text-green-500">Closing Cash Balance</span>
                <span className="text-success-dark dark:text-green-500">{formatCurrency(data.closing_cash_balance)}</span>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
