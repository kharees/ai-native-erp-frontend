'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Package } from 'lucide-react';

interface Courier {
  id: string;
  courier_name: string;
}

interface SalesOrder {
  id: string;
  order_number: string;
}

interface Dispatch {
  id: string;
  sales_order_id: string;
  courier_id: string | null;
  tracking_number: string | null;
  dispatch_status: string;
}

const SHIPPING_BASE = '/api/v1/omnichannel-billing/shipping';

export default function ShippingPage() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showCourierForm, setShowCourierForm] = useState(false);

  const [orderId, setOrderId] = useState('');
  const [courierId, setCourierId] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [newCourierName, setNewCourierName] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`${SHIPPING_BASE}/dispatches`),
      apiClient.get(`${SHIPPING_BASE}/couriers`),
      apiClient.get('/api/v1/omnichannel-billing/sales/orders'),
    ])
      .then(([dispatchRes, courierRes, orderRes]) => {
        setDispatches(dispatchRes.data.items || []);
        setCouriers(courierRes.data.items || []);
        setOrders(orderRes.data.items || []);
      })
      .catch(() => setError('Failed to load shipping data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const courierName = (id: string | null) => couriers.find((c) => c.id === id)?.courier_name || '-';
  const orderNumber = (id: string) => orders.find((o) => o.id === id)?.order_number || id;

  const resetForm = () => {
    setShowForm(false);
    setOrderId('');
    setCourierId('');
    setTrackingNumber('');
  };

  const handleCreateCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`${SHIPPING_BASE}/couriers`, { courier_name: newCourierName });
      setNewCourierName('');
      setShowCourierForm(false);
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to add courier');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`${SHIPPING_BASE}/dispatches`, {
        sales_order_id: orderId,
        courier_id: courierId || null,
        tracking_number: trackingNumber || null,
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to dispatch order');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Dispatch>[] = [
    {
      key: 'sales_order_id',
      header: 'Order',
      sortable: true,
      cell: (row) => orderNumber(row.sales_order_id)
    },
    {
      key: 'courier_id',
      header: 'Courier',
      sortable: true,
      cell: (row) => courierName(row.courier_id)
    },
    {
      key: 'tracking_number',
      header: 'AWB Tracking No',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.tracking_number || '-'}</span>
    },
    {
      key: 'dispatch_status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.dispatch_status === 'DELIVERED' ? 'success' : row.dispatch_status === 'IN_TRANSIT' ? 'warning' : 'neutral'}>
          {row.dispatch_status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Shipping & Logistics" 
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCourierForm(!showCourierForm)}>
            {showCourierForm ? 'Cancel' : 'Add Courier'}
          </Button>
          <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Package size={16} /> : undefined}>
            {showForm ? 'Cancel' : 'Dispatch Order'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Track couriers, AWBs, and delivery statuses.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showCourierForm && (
          <Card>
            <CardContent className="p-4 flex gap-4 items-end bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex-1">
                <Input label="Courier Name" required value={newCourierName} onChange={(e) => setNewCourierName(e.target.value)} />
              </div>
              <Button onClick={handleCreateCourier} isLoading={saving}>Save Courier</Button>
            </CardContent>
          </Card>
        )}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="Dispatch Sales Order">
                <form onSubmit={handleDispatch} className="space-y-4">
                  <FormRow>
                    <Select label="Sales Order" required value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                      <option value="">- Select -</option>
                      {orders.map((o) => (<option key={o.id} value={o.id}>{o.order_number}</option>))}
                    </Select>
                    <Select label="Courier" value={courierId} onChange={(e) => setCourierId(e.target.value)}>
                      <option value="">- None -</option>
                      {couriers.map((c) => (<option key={c.id} value={c.id}>{c.courier_name}</option>))}
                    </Select>
                    <Input label="Tracking Number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>Dispatch</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={dispatches} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search tracking or orders..."
          />
        </div>
      </div>
    </PageShell>
  );
}
