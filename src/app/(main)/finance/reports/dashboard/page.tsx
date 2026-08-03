'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { PageShell, Card, CardContent, Alert } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';

interface DashboardSummary {
  revenue: number | string;
  netProfit: number | string;
  operatingMargin: number | string;
}

interface ARLedger {
  outstanding_amount: number;
}

interface APVendor {
  outstanding_amount: number;
}

export default function FinancialDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [arOutstanding, setArOutstanding] = useState(0);
  const [apOutstanding, setApOutstanding] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/v1/finance-reports/dashboard-summary'),
      apiClient.get<ARLedger[]>('/api/v1/finance-ar-ap/ar/ledgers'),
      apiClient.get<APVendor[]>('/api/v1/finance-ar-ap/ap/vendors'),
    ])
      .then(([summaryRes, arRes, apRes]) => {
        setSummary(summaryRes.data);
        setArOutstanding(arRes.data.reduce((sum, l) => sum + Number(l.outstanding_amount), 0));
        setApOutstanding(apRes.data.reduce((sum, v) => sum + Number(v.outstanding_amount), 0));
      })
      .catch(() => setError('Failed to load financial dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Financial Dashboard">
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">High-level enterprise performance metrics and liquidity overview.</p>

        {error && <Alert variant="error">{error}</Alert>}
        
        {loading && !summary ? (
          <div className="text-neutral-500">Loading dashboard...</div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-t-4 border-t-accent-500 dark:border-t-accent-600">
                <CardContent className="p-6">
                  <p className="text-caption font-medium text-neutral-500 dark:text-neutral-400 mb-2">Total Revenue (YTD)</p>
                  <p className="text-h2 font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(summary.revenue)}</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-success-500 dark:border-t-success-600">
                <CardContent className="p-6">
                  <p className="text-caption font-medium text-neutral-500 dark:text-neutral-400 mb-2">Net Profit (YTD)</p>
                  <p className="text-h2 font-semibold text-success-dark dark:text-green-400">{formatCurrency(summary.netProfit)}</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 font-medium">{summary.operatingMargin}% Margin</p>
                </CardContent>
              </Card>

              <Card className="border-t-4 border-t-indigo-500 dark:border-t-indigo-500">
                <CardContent className="p-6">
                  <p className="text-caption font-medium text-neutral-500 dark:text-neutral-400 mb-2">Net AR - AP Position</p>
                  <p className="text-h2 font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(arOutstanding - apOutstanding)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">Receivables vs Payables</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-body text-neutral-600 dark:text-neutral-400">Accounts Receivable (You are owed)</span>
                      <span className="font-semibold text-success-dark dark:text-green-500 text-lg">{formatCurrency(arOutstanding)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-body text-neutral-600 dark:text-neutral-400">Accounts Payable (You owe)</span>
                      <span className="font-semibold text-danger-dark dark:text-red-500 text-lg">{formatCurrency(apOutstanding)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </PageShell>
  );
}
