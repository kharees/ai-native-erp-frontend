'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { PageShell, Card, CardContent, Alert } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';

interface LeaderboardItem {
  name: string;
  value: number;
  count: number;
}

interface Leaderboards {
  top_products: LeaderboardItem[];
  top_customers: LeaderboardItem[];
  top_channels: LeaderboardItem[];
}

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState<Leaderboards | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/api/v1/omnichannel-billing/analytics/sales/leaderboards')
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load executive dashboard'));
  }, []);

  const renderList = (title: string, items: LeaderboardItem[]) => (
    <Card className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">{title}</h2>
      </div>
      <CardContent className="flex-1 p-0">
        {items.length === 0 ? (
          <div className="p-6 text-center text-body text-neutral-500">No data available.</div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
            {items.map((item, idx) => (
              <li key={idx} className="px-4 py-3 flex justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <span className="text-body font-medium text-neutral-900 dark:text-neutral-100">{item.name}</span>
                <span className="text-body font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(item.value)} <span className="text-caption text-neutral-500 font-normal ml-1">({item.count})</span></span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );

  return (
    <PageShell 
      title="Executive Dashboard" 
      actions={
        <Link href="/omnichannel-billing/customers" className="text-caption text-accent-600 hover:text-accent-700 dark:text-accent-400 dark:hover:text-accent-300 font-medium">
          Manage Customers &rarr;
        </Link>
      }
    >
      <div className="space-y-6 max-w-7xl">
        <p className="text-body text-neutral-500 dark:text-neutral-400">High-level KPIs, best-selling products, and top customers.</p>
        
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data ? (
            <>
              {renderList('Top Products', data.top_products)}
              {renderList('Top Customers', data.top_customers)}
              {renderList('Top Channels', data.top_channels)}
            </>
          ) : (
            <p className="text-body text-neutral-500 col-span-3">Loading...</p>
          )}
        </div>
      </div>
    </PageShell>
  );
}
