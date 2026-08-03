'use client';
import React, { useState, useEffect, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, Card, CardContent, Input, Select, DataTable, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { X, ShieldAlert } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action_category: string;
  action_type: string;
  action_source: string;
  resource_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  correlation_id: string | null;
  created_at: string;
}

export default function AuditDashboardPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params: Record<string, string> = {};
    if (category) params.action_category = category;
    apiClient
      .get('/api/v1/audit/', { params })
      .then((res) => setLogs(res.data || []))
      .catch((err) => setError(isApiError(err) ? err.message : 'Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (log.resource_id || '').toLowerCase().includes(q) ||
      (log.ip_address || '').toLowerCase().includes(q) ||
      log.action_type.toLowerCase().includes(q)
    );
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      cell: (row) => <span className="text-sm text-neutral-600 dark:text-neutral-400">{new Date(row.created_at).toLocaleString()}</span>
    },
    {
      key: 'ip_address',
      header: 'IP',
      sortable: true,
      cell: (row) => <span className="text-sm text-neutral-600 dark:text-neutral-400">{row.ip_address || '-'}</span>
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="text-[10px] uppercase tracking-wider">{row.action_category}</Badge>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{row.action_type}</span>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate max-w-[200px]">
            {row.resource_id || ''}
          </div>
        </div>
      )
    }
  ];

  return (
    <PageShell
      title="Audit & Activity Log"
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Immutable enterprise ledger of systemic actions and modifications.</p>

        {error && (
          <div className="p-4 bg-danger-50 text-danger-700 rounded-lg border border-danger-200 text-sm">{error}</div>
        )}

        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-64 shrink-0">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Category: All</option>
                <option value="AUTH">AUTH</option>
                <option value="RBAC">RBAC</option>
                <option value="ERP_CONNECTOR">ERP_CONNECTOR</option>
                <option value="MIGRATION">MIGRATION</option>
                <option value="MIGRATION_EXECUTION">MIGRATION_EXECUTION</option>
                <option value="MIGRATION_AI">MIGRATION_AI</option>
              </Select>
            </div>
            <div className="flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by resource ID, IP, or action..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row min-h-[600px] border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
          <div className={`w-full ${selectedLog ? 'md:w-1/2 border-r border-neutral-200 dark:border-neutral-800' : ''} transition-all duration-300 flex flex-col h-[600px] overflow-hidden`}>
            <DataTable
              data={filteredLogs}
              columns={columns}
              keyExtractor={(row) => row.id}
              isLoading={loading}
              onRowClick={(row) => setSelectedLog(row)}
            />
          </div>

          {selectedLog && (
            <div className="w-full md:w-1/2 bg-neutral-50 dark:bg-neutral-950 p-6 overflow-y-auto h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <ShieldAlert size={18} className="text-accent-500" />
                  Log Details
                </h3>
                <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Log ID</div>
                    <div className="text-sm font-mono text-neutral-900 dark:text-neutral-300">{selectedLog.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Source</div>
                    <Badge variant="success" className="uppercase">{selectedLog.action_source}</Badge>
                  </div>
                </div>

                {(selectedLog.old_values || selectedLog.new_values) && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider font-semibold">Delta Tracking</div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="bg-danger-50/50 dark:bg-danger-950/20 border border-danger-100 dark:border-danger-900/30 rounded-lg p-4">
                        <div className="text-xs font-semibold text-danger-600 dark:text-red-400 mb-2">Old Value</div>
                        <pre className="text-[10px] sm:text-xs text-danger-800 dark:text-red-300 font-mono overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.old_values || {}, null, 2)}
                        </pre>
                      </div>
                      <div className="bg-success-50/50 dark:bg-success-950/20 border border-success-100 dark:border-success-900/30 rounded-lg p-4">
                        <div className="text-xs font-semibold text-success-600 dark:text-green-400 mb-2">New Value</div>
                        <pre className="text-[10px] sm:text-xs text-success-800 dark:text-green-300 font-mono overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.new_values || {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wider font-semibold">Network Trace</div>
                  <pre className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-lg overflow-x-auto font-mono">
                    {`User-Agent: ${selectedLog.user_agent || 'unknown'}
IP: ${selectedLog.ip_address || 'unknown'}
Correlation-ID: ${selectedLog.correlation_id || 'none'}`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
