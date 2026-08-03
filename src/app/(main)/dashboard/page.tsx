'use client';

import { useEffect, useState } from 'react';
import LogoutButton from '@/components/LogoutButton';
import apiClient, { isApiError } from '@/lib/apiClient';
import { formatCurrency } from '@/lib/formatCurrency';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  PageShell,
  StatCard,
  SkeletonText,
} from '@/components/ui';
import { TrendingUp, Wallet, Receipt, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  todays_sales: { value: number; invoice_count: number; change_pct_vs_yesterday: number | null };
  cash_position: { value: number | string };
  pending_receivables: { value: number | string; overdue_invoice_count: number };
  low_stock: { sku_count: number; critical_count: number };
}

interface MorningBrief {
  narrated_lines: string[];
}

interface CashFlowPoint {
  date: string;
  inflow: number | string;
  outflow: number | string;
}

interface CashFlowDailyReport {
  days: number;
  points: CashFlowPoint[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [brief, setBrief] = useState<MorningBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(true);
  const [briefUnavailable, setBriefUnavailable] = useState(false);

  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([]);
  const [cashFlowLoading, setCashFlowLoading] = useState(true);

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const logFailure = (endpoint: string, err: unknown) => {
      if (isApiError(err)) {
        console.error(`Dashboard widget failed: ${endpoint}`, { status: err.status, body: err.detail ?? err.message });
      } else {
        console.error(`Dashboard widget failed: ${endpoint}`, err);
      }
    };

    apiClient
      .get('/api/v1/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => {
        logFailure('/api/v1/dashboard/stats', err);
        setErrors((prev) => [...prev, 'Could not load dashboard stats.']);
      })
      .finally(() => setStatsLoading(false));

    apiClient
      .get('/api/v1/dashboard/morning-brief')
      .then((res) => setBrief(res.data))
      .catch((err) => {
        // AI-not-configured is a real, expected state in some environments
        // (no provider API key) -- shown as a quiet unavailable message,
        // not an error banner, since it's not something the user can fix.
        if (isApiError(err) && err.status === 503) {
          setBriefUnavailable(true);
        } else {
          logFailure('/api/v1/dashboard/morning-brief', err);
          setErrors((prev) => [...prev, 'Could not load the morning brief.']);
        }
      })
      .finally(() => setBriefLoading(false));

    apiClient
      .get('/api/v1/finance-reports/cash-flow-daily?days=30')
      .then((res) => setCashFlow((res.data as CashFlowDailyReport).points))
      .catch((err) => {
        logFailure('/api/v1/finance-reports/cash-flow-daily', err);
        setErrors((prev) => [...prev, 'Could not load the cash flow chart.']);
      })
      .finally(() => setCashFlowLoading(false));
  }, []);

  const sales = stats?.todays_sales;
  const salesTrend = sales?.change_pct_vs_yesterday == null ? undefined : sales.change_pct_vs_yesterday > 0 ? 'up' : sales.change_pct_vs_yesterday < 0 ? 'down' : 'neutral';
  const salesTrendValue = sales?.change_pct_vs_yesterday == null ? undefined : `${sales.change_pct_vs_yesterday > 0 ? '+' : ''}${sales.change_pct_vs_yesterday}% vs yesterday`;

  const receivables = stats?.pending_receivables;
  const lowStock = stats?.low_stock;

  return (
    <PageShell title="Dashboard" actions={<LogoutButton />}>
      <div className="space-y-6 max-w-7xl">
        {errors.length > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-danger-light border border-danger/20 text-danger-dark text-body">
            <span aria-hidden className="mt-0.5">⚠</span>
            <ul className="space-y-0.5">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            data-testid="stat-todays-sales"
            label="Today's Sales"
            value={statsLoading ? <SkeletonText lines={1} className="w-24 mt-2" /> : formatCurrency(sales?.value ?? 0, { whole: true })}
            icon={<TrendingUp size={18} />}
            trend={statsLoading ? undefined : salesTrend}
            trendValue={statsLoading ? undefined : salesTrendValue}
          />
          <StatCard
            data-testid="stat-cash-position"
            label="Cash Position"
            value={statsLoading ? <SkeletonText lines={1} className="w-24 mt-2" /> : formatCurrency(stats?.cash_position.value ?? 0, { whole: true })}
            icon={<Wallet size={18} />}
          />
          <StatCard
            data-testid="stat-pending-receivables"
            label="Pending Receivables"
            value={statsLoading ? <SkeletonText lines={1} className="w-24 mt-2" /> : formatCurrency(receivables?.value ?? 0, { whole: true })}
            icon={<Receipt size={18} />}
            trend={statsLoading ? undefined : (receivables?.overdue_invoice_count ?? 0) > 0 ? 'down' : 'neutral'}
            trendValue={statsLoading ? undefined : `${receivables?.overdue_invoice_count ?? 0} overdue`}
          />
          <StatCard
            data-testid="stat-low-stock"
            label="Low Stock Alerts"
            value={statsLoading ? <SkeletonText lines={1} className="w-16 mt-2" /> : `${lowStock?.sku_count ?? 0} SKUs`}
            icon={<AlertTriangle size={18} />}
            trend={statsLoading ? undefined : (lowStock?.critical_count ?? 0) > 0 ? 'down' : 'neutral'}
            trendValue={statsLoading ? undefined : `${lowStock?.critical_count ?? 0} critical`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Morning Brief</CardTitle>
              <CardDescription>AI-narrated priorities for today</CardDescription>
            </CardHeader>
            <CardContent>
              {briefLoading ? (
                <div className="space-y-3">
                  <SkeletonText lines={1} />
                  <SkeletonText lines={1} />
                  <SkeletonText lines={1} />
                </div>
              ) : briefUnavailable ? (
                <p className="text-body text-neutral-500 dark:text-neutral-400">
                  Morning brief is unavailable right now (AI provider not configured).
                </p>
              ) : !brief || brief.narrated_lines.length === 0 ? (
                <div className="flex items-start gap-2 text-body text-neutral-500 dark:text-neutral-400">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
                  <span>Nothing urgent today -- no low stock, overdue invoices, or notable changes.</span>
                </div>
              ) : (
                <ul className="space-y-3">
                  {brief.narrated_lines.map((line, i) => (
                    <li key={i} className="flex items-start gap-2 text-body text-neutral-800 dark:text-neutral-200">
                      <Sparkles size={14} className="mt-1 shrink-0 text-accent-600 dark:text-accent-400" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Daily inflow vs. outflow, last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {cashFlowLoading ? (
                <div className="h-72 flex items-center justify-center">
                  <SkeletonText lines={1} className="w-1/2" />
                </div>
              ) : cashFlow.length === 0 ? (
                <div className="h-72 flex items-center justify-center text-body text-neutral-500">No cash flow data yet.</div>
              ) : (
                <div className="h-72 text-neutral-500 dark:text-neutral-400">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cashFlow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cashFlowInflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="cashFlowOutflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-800" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        tick={{ fill: 'currentColor', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v: number) => formatCurrency(v, { whole: true })}
                        tick={{ fill: 'currentColor', fontSize: 11 }}
                        width={72}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(value as number)}
                        labelFormatter={(d) => new Date(String(d)).toLocaleDateString()}
                        contentStyle={{ fontSize: 13 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="inflow" name="Inflow" stroke="#16A34A" strokeWidth={2} fill="url(#cashFlowInflow)" />
                      <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#DC2626" strokeWidth={2} fill="url(#cashFlowOutflow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
