'use client';
import React, { useState, useEffect } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, Card, CardContent, Alert } from '@/components/ui';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface SecurityScore {
  score: number;
  trend: string;
  active_incidents: string[];
}

export default function IntelligenceDashboardPage() {
  const [security, setSecurity] = useState<SecurityScore | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Smart Role Recommendations (/identity/recommendations) and the Audit
    // Copilot natural-language search (/audit/natural-language-search)
    // were removed from this page -- both backend endpoints were deleted
    // (see app/api/v1/endpoints/intelligence.py's module docstring): they
    // backed 100% fabricated/hardcoded output with no real logic
    // underneath. No real replacement REST endpoint exists; the real
    // heuristic analysis (IdentityAnalyzer/SecurityAnalyzer) is only
    // exposed via the AI chat orchestrator's tool-calling, not a
    // dashboard widget.
    apiClient.get('/api/v1/intelligence/security/risk-scores')
      .then((res) => setSecurity(res.data))
      .catch((err) => setError(isApiError(err) ? err.message : 'Failed to load intelligence dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell 
      title="Intelligence Command Center"
    >
      <div className="space-y-8">
        <p className="text-body text-neutral-500 dark:text-neutral-400 mt-1">Real-time heuristic monitoring of your identity and security perimeter.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
          <Card className="relative overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">Organization Security Score</h3>
              {loading ? (
                <p className="text-sm text-neutral-500">Loading...</p>
              ) : security ? (
                <>
                  <div className="flex items-end gap-4">
                    <span className={`text-6xl font-black tracking-tighter ${security.score > 80 ? 'text-success-500 dark:text-green-500' : 'text-warning-500'}`}>
                      {security.score}
                    </span>
                    <span className="text-sm font-medium text-neutral-400 mb-2">/ 100</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-950/20 border border-warning-100 dark:border-warning-900/50 px-3 py-2 rounded-lg w-fit">
                    Trend: {security.trend}
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-500">No data available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6 flex items-center gap-2">
                <ShieldAlert size={20} className="text-danger-500" />
                Active Incidents
              </h3>
              {!security || security.active_incidents.length === 0 ? (
                <p className="text-sm text-neutral-500">No active incidents detected.</p>
              ) : (
                <div className="space-y-3">
                  {security.active_incidents.map((incident, i) => (
                    <div key={i} className="p-4 rounded-xl border border-danger-200 dark:border-danger-900/50 bg-danger-50/50 dark:bg-danger-900/10 flex items-start gap-3">
                      <AlertTriangle size={16} className="text-danger-500 mt-0.5 shrink-0" />
                      <p className="text-sm text-danger-700 dark:text-red-300">{incident}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
