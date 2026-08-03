'use client';
import React, { useState, useEffect, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, Card, CardContent, Button, Badge, DataTable, Alert } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Monitor, Smartphone, Globe, Shield, LogOut } from 'lucide-react';

interface TenantSession {
  id: string;
  device_fingerprint: string | null;
  ip_address: string | null;
  browser: string | null;
  os: string | null;
  is_active: boolean;
  last_active_at: string;
  expires_at: string;
}

interface TenantDevice {
  id: string;
  device_fingerprint: string;
  browser: string | null;
  os: string | null;
  last_ip_address: string | null;
  is_trusted: boolean;
  last_seen_at: string;
}

export default function SessionManagementPage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'devices'>('sessions');
  const [sessions, setSessions] = useState<TenantSession[]>([]);
  const [devices, setDevices] = useState<TenantDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      apiClient.get('/api/v1/sessions/me'),
      apiClient.get('/api/v1/sessions/devices'),
    ])
      .then(([sessRes, devRes]) => {
        setSessions(sessRes.data || []);
        setDevices(devRes.data || []);
      })
      .catch((err) => setError(isApiError(err) ? err.message : 'Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRevoke = async (id: string) => {
    setActionLoading(true);
    setError('');
    try {
      await apiClient.delete(`/api/v1/sessions/${id}`);
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to revoke session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeAll = async () => {
    setActionLoading(true);
    setError('');
    try {
      await apiClient.delete('/api/v1/sessions/me/all');
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to revoke sessions');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrustDevice = async (id: string) => {
    setActionLoading(true);
    setError('');
    try {
      await apiClient.patch(`/api/v1/sessions/devices/${id}/trust`);
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to trust device');
    } finally {
      setActionLoading(false);
    }
  };

  const getDeviceIcon = (os: string | null) => {
    const osLower = os?.toLowerCase() || '';
    if (osLower.includes('ios') || osLower.includes('android')) return <Smartphone size={20} className="text-neutral-500" />;
    return <Monitor size={20} className="text-neutral-500" />;
  };

  const deviceColumns: Column<TenantDevice>[] = [
    {
      key: 'device',
      header: 'Device',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {getDeviceIcon(row.os)}
          <div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100">{row.browser || 'Unknown'} / {row.os || 'Unknown'}</div>
            <div className="text-caption text-neutral-500">{row.last_ip_address || ''}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={row.is_trusted ? 'success' : 'neutral'} className="flex items-center gap-1 w-fit">
          {row.is_trusted ? <Shield size={12} /> : null}
          {row.is_trusted ? 'Trusted' : 'Untrusted'}
        </Badge>
      )
    },
    {
      key: 'last_seen_at',
      header: 'Last Seen',
      sortable: true,
      cell: (row) => <span className="text-sm text-neutral-600 dark:text-neutral-400">{new Date(row.last_seen_at).toLocaleString()}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        !row.is_trusted && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleTrustDevice(row.id)}
            disabled={actionLoading}
          >
            Trust Device
          </Button>
        )
      )
    }
  ];

  return (
    <PageShell 
      title="Active Sessions" 
      actions={
        <Button 
          variant="outline"
          className="text-danger-600 dark:text-red-400 border-danger-200 dark:border-red-900/30 hover:bg-danger-50 dark:hover:bg-red-900/10"
          onClick={handleRevokeAll} 
          disabled={actionLoading}
          leftIcon={<LogOut size={16} />}
        >
          Sign out all other sessions
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage your signed-in devices and active web sessions.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="border-b border-neutral-200 dark:border-neutral-800">
          <nav className="-mb-px flex space-x-8">
            {(['sessions', 'devices'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-accent-600 text-accent-700 dark:border-accent-500 dark:text-accent-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
                }`}
              >
                {tab === 'sessions' ? 'Active Sessions' : 'Trusted Devices'}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-neutral-500">Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-neutral-500">No active sessions found.</p>
            ) : sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                      {getDeviceIcon(session.os)}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        {session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}
                        <Badge variant="success">Active Now</Badge>
                      </h3>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1"><Globe size={14}/> IP: {session.ip_address || 'unknown'}</span>
                        <span>Expires: {new Date(session.expires_at).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                        Last active: {new Date(session.last_active_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleRevoke(session.id)}
                    disabled={actionLoading}
                    className="self-start md:self-center"
                  >
                    Revoke Session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="h-[600px]">
            <DataTable 
              data={devices} 
              columns={deviceColumns} 
              keyExtractor={(row) => row.id} 
              isLoading={loading}
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
