'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { PageShell, Card, CardContent, StatCard, Alert, Button } from '@/components/ui';
import { DollarSign, TrendingUp, Receipt, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface FinancialSummary {
  total_outstanding: number;
  total_collected: number;
  total_tax_collected: number;
  aging_buckets: Record<string, number>;
}

export default function FinancialAnalyticsPage() {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get('/api/v1/omnichannel-billing/analytics/financial/summary')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load financial analytics'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell 
      title="Financial Analytics" 
      actions={
        <Link href="/omnichannel-billing/outstanding">
          <Button variant="outline" rightIcon={<ArrowRight size={16} />}>
            Outstanding Dashboard
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Track collections, outstanding agings, and tax summaries.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            label="Total Outstanding"
            value={loading ? '-' : (data ? formatCurrency(data.total_outstanding) : '-')}
            icon={<DollarSign size={20} className="text-danger-dark dark:text-red-500" />}
          />
          <StatCard 
            label="Total Collected"
            value={loading ? '-' : (data ? formatCurrency(data.total_collected) : '-')}
            icon={<TrendingUp size={20} className="text-success-dark dark:text-green-500" />}
          />
          <StatCard 
            label="Total Tax Collected"
            value={loading ? '-' : (data ? formatCurrency(data.total_tax_collected) : '-')}
            icon={<Receipt size={20} className="text-accent-600 dark:text-accent-400" />}
          />
        </div>

        <Card>
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Aging Buckets</h3>
          </div>
          <CardContent className="p-0">
            {data ? (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {Object.entries(data.aging_buckets).map(([bucket, amount]) => (
                  <li key={bucket} className="flex justify-between items-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300 capitalize">{bucket.replace(/_/g, ' ')}</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full text-sm">
                      {formatCurrency(amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-6">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {loading ? 'Loading aging data...' : 'No aging data available.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
