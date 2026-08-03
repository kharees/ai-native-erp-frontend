'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/apiClient';
import { PageShell, Card, CardContent, Alert, Badge, Button } from '@/components/ui';
import { Sparkles, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Forecast {
  item_id: string;
  item_name: string;
  current_stock: number;
  projected_demand_30d: number;
  confidence_score: number;
  seasonality_trend: string;
}

interface Recommendation {
  item_id: string;
  item_name: string;
  recommendation_type: string;
  rationale: string;
  potential_savings: number;
}

interface Dashboard {
  health_score: number;
  total_alerts: number;
  optimization_opportunities: number;
  forecasts: Forecast[];
  recommendations: Recommendation[];
}

export default function AIDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/api/v1/universal-intelligence/dashboard')
      .then((res) => setDashboard(res.data))
      .catch(() => setError('Failed to load AI intelligence dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell 
      title="AI Inventory Intelligence" 
      actions={
        <Link href="/ai-assistant?module=inventory">
          <Button variant="primary" leftIcon={<Sparkles size={16} />} className="bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-700 hover:to-indigo-700 border-0">
            Ask AI Assistant
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Predictive forecasting and actionable optimization recommendations.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-success-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/30 border-success-200 dark:border-green-900">
            <CardContent className="p-6">
              <h3 className="text-caption font-semibold text-success-dark dark:text-green-500 mb-2">Inventory Health Score</h3>
              <div className="flex items-end gap-2">
                <p className="text-h1 font-bold text-success-700 dark:text-green-400">{loading ? '-' : dashboard?.health_score ?? 0}</p>
                <span className="text-success-600 dark:text-green-500 font-medium mb-1.5">/ 100</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-caption font-semibold text-neutral-500 dark:text-neutral-400 mb-2">Active AI Alerts</h3>
              <p className="text-h1 font-bold text-warning-dark dark:text-amber-500">{loading ? '-' : dashboard?.total_alerts ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-caption font-semibold text-neutral-500 dark:text-neutral-400 mb-2">Optimization Opportunities</h3>
              <p className="text-h1 font-bold text-accent-600 dark:text-accent-500">{loading ? '-' : dashboard?.optimization_opportunities ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-semibold text-lg text-indigo-700 dark:text-indigo-400">Demand Forecasting</h3>
            </div>
            <CardContent className="p-6 flex-1 flex flex-col gap-4">
              {loading ? (
                <p className="text-sm text-neutral-500">Loading forecasts...</p>
              ) : !dashboard?.forecasts.length ? (
                <p className="text-sm text-neutral-500 italic">No forecasts available.</p>
              ) : dashboard.forecasts.map((f) => (
                <div key={f.item_id} className="border border-neutral-100 dark:border-neutral-800 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-900/50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{f.item_name}</span>
                    <Badge variant="success" className="whitespace-nowrap">{Math.round(f.confidence_score * 100)}% Confidence</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-caption text-neutral-500">Projected Demand (30d)</p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{f.projected_demand_30d} Units</p>
                    </div>
                    <div>
                      <p className="text-caption text-neutral-500">Seasonality Trend</p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 capitalize">{f.seasonality_trend}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
              <Zap size={20} className="text-accent-600 dark:text-accent-400" />
              <h3 className="font-semibold text-lg text-accent-700 dark:text-accent-400">Smart Optimizations</h3>
            </div>
            <CardContent className="p-6 flex-1 flex flex-col gap-4">
              {loading ? (
                <p className="text-sm text-neutral-500">Loading recommendations...</p>
              ) : !dashboard?.recommendations.length ? (
                <p className="text-sm text-neutral-500 italic">No recommendations available.</p>
              ) : dashboard.recommendations.map((r) => (
                <div key={r.item_id} className="border border-neutral-100 dark:border-neutral-800 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-900/50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{r.item_name}</span>
                    <Badge variant="danger" className="whitespace-nowrap flex items-center gap-1">
                      <AlertCircle size={12} /> {r.recommendation_type}
                    </Badge>
                  </div>
                  <p className="text-body text-neutral-600 dark:text-neutral-400 mb-3">{r.rationale}</p>
                  <p className="text-sm text-success-dark dark:text-green-500 font-semibold bg-success-light/20 dark:bg-green-950/30 px-3 py-1.5 rounded-md inline-block">
                    Potential Savings: {formatCurrency(r.potential_savings)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
