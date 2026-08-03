'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { PageShell, StatCard, SkeletonText, Alert } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';

interface Customer {
  id: string;
  name: string;
}

interface AgingBucket {
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total: number;
}

const ZERO: AgingBucket = { bucket_0_30: 0, bucket_31_60: 0, bucket_61_90: 0, bucket_90_plus: 0, total: 0 };

export default function OutstandingPage() {
  const [totals, setTotals] = useState<AgingBucket>(ZERO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/api/v1/omnichannel-billing/customers/')
      .then(async (custRes) => {
        const customers: Customer[] = custRes.data.items || [];
        const agingResults = await Promise.all(
          customers.map((c) =>
            apiClient
              .get<AgingBucket>(`/api/v1/omnichannel-billing/collections/aging/${c.id}`)
              .then((r) => r.data)
              .catch(() => ZERO)
          )
        );
        const sum = agingResults.reduce(
          (acc, a) => ({
            bucket_0_30: acc.bucket_0_30 + Number(a.bucket_0_30),
            bucket_31_60: acc.bucket_31_60 + Number(a.bucket_31_60),
            bucket_61_90: acc.bucket_61_90 + Number(a.bucket_61_90),
            bucket_90_plus: acc.bucket_90_plus + Number(a.bucket_90_plus),
            total: acc.total + Number(a.total),
          }),
          { ...ZERO }
        );
        setTotals(sum);
      })
      .catch(() => setError('Failed to load outstanding balances'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Outstanding Dashboard">
      <div className="space-y-6 max-w-7xl">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Customer outstanding balances and aging, aggregated across all customers.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Outstanding"
            value={loading ? <SkeletonText lines={1} className="w-24 mt-2" /> : formatCurrency(totals.total)}
          />
          <StatCard
            label="0 - 30 Days"
            value={loading ? <SkeletonText lines={1} className="w-24 mt-2" /> : formatCurrency(totals.bucket_0_30)}
          />
          <StatCard
            label="31 - 90 Days"
            value={loading ? <SkeletonText lines={1} className="w-24 mt-2" /> : formatCurrency(totals.bucket_31_60 + totals.bucket_61_90)}
          />
          <StatCard
            label="90+ Days Overdue"
            value={loading ? <SkeletonText lines={1} className="w-24 mt-2" /> : formatCurrency(totals.bucket_90_plus)}
          />
        </div>
      </div>
    </PageShell>
  );
}
