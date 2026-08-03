'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { RefreshCcw } from 'lucide-react';

interface Channel {
  id: string;
  platform_name: string;
}

interface OrderMapping {
  id: string;
  channel_id: string;
  external_order_id: string;
  sync_status: string;
}

const CHANNELS_BASE = '/api/v1/omnichannel-billing/channels';

export default function OrderQueuePage() {
  const [mappings, setMappings] = useState<OrderMapping[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [channelId, setChannelId] = useState('');
  const [externalOrderId, setExternalOrderId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([apiClient.get(`${CHANNELS_BASE}/orders`), apiClient.get(`${CHANNELS_BASE}/channels`)])
      .then(([mapRes, chanRes]) => {
        setMappings(mapRes.data.items || []);
        setChannels(chanRes.data.items || []);
      })
      .catch(() => setError('Failed to load order queue'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const channelName = (id: string) => channels.find((c) => c.id === id)?.platform_name || id;

  const resetForm = () => {
    setShowForm(false);
    setChannelId('');
    setExternalOrderId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`${CHANNELS_BASE}/orders`, { channel_id: channelId, external_order_id: externalOrderId });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to sync order');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<OrderMapping>[] = [
    {
      key: 'external_order_id',
      header: 'Order Ref',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.external_order_id}</span>
    },
    {
      key: 'channel_id',
      header: 'Channel',
      sortable: true,
      cell: (row) => channelName(row.channel_id)
    },
    {
      key: 'sync_status',
      header: 'Sync Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.sync_status === 'SYNCED' ? 'success' : row.sync_status === 'FAILED' ? 'danger' : 'neutral'}>
          {row.sync_status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Omnichannel Order Queue" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <RefreshCcw size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Sync Order'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Orders synced from Web, Mobile, Social, and Marketplaces.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {channels.length === 0 && !loading && (
          <Alert variant="warning">No sales channels configured yet - configure one before syncing orders.</Alert>
        )}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="Sync External Order">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Channel" required value={channelId} onChange={(e) => setChannelId(e.target.value)}>
                      <option value="">- Select -</option>
                      {channels.map((c) => (<option key={c.id} value={c.id}>{c.platform_name}</option>))}
                    </Select>
                    <Input label="External Order ID" required value={externalOrderId} onChange={(e) => setExternalOrderId(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Sync Order</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={mappings} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search order queue..."
          />
        </div>
      </div>
    </PageShell>
  );
}
