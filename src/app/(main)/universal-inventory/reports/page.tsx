'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { PageShell, Card, CardContent, StatCard, Alert, Button } from '@/components/ui';
import { Download, TrendingDown, Clock, Box, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Summary {
  total_quantity: number;
  total_value: number;
  warehouse_count: number;
  item_count: number;
}

interface AgingItem {
  aging_bucket: string;
}

interface AbcItem {
  classification: string;
}

export default function ReportsDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [aging, setAging] = useState<AgingItem[]>([]);
  const [abc, setAbc] = useState<AbcItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/api/v1/universal-reports/summary'),
      apiClient.get('/api/v1/universal-reports/aging'),
      apiClient.get('/api/v1/universal-reports/abc-analysis'),
    ])
      .then(([summaryRes, agingRes, abcRes]) => {
        setSummary(summaryRes.data);
        setAging(Array.isArray(agingRes.data) ? agingRes.data : []);
        setAbc(Array.isArray(abcRes.data) ? abcRes.data : []);
      })
      .catch(() => setError('Failed to load inventory analytics'))
      .finally(() => setLoading(false));
  }, []);

  const deadStockPct = aging.length > 0 ? Math.round((aging.filter((a) => a.aging_bucket === '180+').length / aging.length) * 100) : 0;
  const bucketCounts = ['0-30', '31-90', '91-180', '180+'].map((bucket) => ({
    bucket,
    count: aging.filter((a) => a.aging_bucket === bucket).length,
  }));
  const abcCounts = ['A', 'B', 'C'].map((cls) => ({
    cls,
    count: abc.filter((a) => a.classification === cls).length,
  }));

  return (
    <PageShell 
      title="Executive Inventory Analytics" 
      actions={
        <Link href="/universal-inventory/reports/standard">
          <Button variant="secondary" leftIcon={<Download size={16} />}>
            Standard Reports (CSV)
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Real-time valuation, aging, and KPI tracking.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Inventory Value" 
            value={loading ? '-' : formatCurrency(summary?.total_value || 0)}
            icon={<DollarSign size={20} className="text-accent-600 dark:text-accent-400" />}
            trend="up"
            trendValue="5.2%"
          />
          <StatCard 
            label="Total Items on Hand" 
            value={loading ? '-' : Number(summary?.total_quantity || 0).toLocaleString()}
            icon={<Box size={20} className="text-indigo-600 dark:text-indigo-400" />}
          />
          <StatCard 
            label="Dead Stock (180+ Days)" 
            value={loading ? '-' : `${deadStockPct}%`}
            icon={<TrendingDown size={20} className="text-danger-dark dark:text-red-500" />}
            trend={deadStockPct > 10 ? 'down' : undefined}
            trendValue={deadStockPct > 10 ? `${deadStockPct - 10}%` : undefined}
          />
          <StatCard 
            label="Active Warehouses" 
            value={loading ? '-' : summary?.warehouse_count ?? 0}
            icon={<Clock size={20} className="text-success-dark dark:text-green-500" />}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <Card className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">ABC Analysis (Pareto Distribution)</h3>
            </div>
            <CardContent className="p-0 flex-1">
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {abcCounts.map(({ cls, count }) => (
                  <li key={cls} className="flex justify-between items-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Class {cls}</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full text-sm">{count} item(s)</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Inventory Aging Profile</h3>
            </div>
            <CardContent className="p-0 flex-1">
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {bucketCounts.map(({ bucket, count }) => (
                  <li key={bucket} className="flex justify-between items-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{bucket} days</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full text-sm">{count} balance(s)</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
