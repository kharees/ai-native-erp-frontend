'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, Card, Button, Badge, Alert, Input } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';
import { ArrowLeft, PackageCheck } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

interface PurchaseOrderLine {
  id: string;
  item_id: string;
  quantity: number;
  unit_cost: string;
  quantity_received: number;
}

interface PurchaseOrder {
  id: string;
  vendor_id: string;
  warehouse_id: string;
  po_number: string;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
  expected_date: string | null;
  created_at: string;
  lines: PurchaseOrderLine[];
}

const BASE = '/api/v1/procurement';

function statusVariant(status: PurchaseOrder['status']): 'success' | 'accent' | 'warning' | 'neutral' | 'danger' {
  switch (status) {
    case 'received': return 'success';
    case 'partially_received': return 'warning';
    case 'cancelled': return 'danger';
    case 'sent': return 'accent';
    default: return 'neutral';
  }
}

export default function PurchaseOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const poId = params.id;

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [receiving, setReceiving] = useState(false);
  const [receiveQty, setReceiveQty] = useState<Record<string, string>>({});
  const [lastBillAmount, setLastBillAmount] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!poId) return;
    setLoading(true);
    setError('');
    Promise.all([
      apiClient.get(`${BASE}/purchase-orders/${poId}`),
      apiClient.get('/api/v1/finance-ar-ap/ap/vendors'),
      apiClient.get('/api/v1/universal-inventory/items'),
    ])
      .then(([poRes, vendorRes, itemRes]) => {
        setPo(poRes.data);
        setVendors(vendorRes.data || []);
        setItems(itemRes.data?.items ?? []);
        const defaults: Record<string, string> = {};
        for (const line of poRes.data.lines as PurchaseOrderLine[]) {
          defaults[line.id] = String(line.quantity - line.quantity_received);
        }
        setReceiveQty(defaults);
      })
      .catch((err) => setError(isApiError(err) ? err.message : 'Failed to load purchase order'))
      .finally(() => setLoading(false));
  }, [poId]);

  useEffect(() => {
    load();
  }, [load]);

  const vendorName = (id: string) => vendors.find((v) => v.id === id)?.name || id;
  const itemName = (id: string) => items.find((i) => i.id === id)?.name || id;

  const isReceivable = po ? po.status !== 'received' && po.status !== 'cancelled' : false;

  const handleReceive = async () => {
    if (!po) return;
    const lines = po.lines
      .map((line) => ({ line_id: line.id, quantity: parseFloat(receiveQty[line.id] || '0') }))
      .filter((l) => l.quantity > 0);
    if (lines.length === 0) return;

    setReceiving(true);
    setError('');
    setLastBillAmount(null);
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await apiClient.post(
        `${BASE}/purchase-orders/${poId}/receive`,
        { lines },
        { headers: { 'Idempotency-Key': idempotencyKey } }
      );
      setLastBillAmount(res.data.ap_bill_amount);
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to receive stock against this purchase order.');
    } finally {
      setReceiving(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Purchase Order">
        <p className="text-body text-neutral-500">Loading...</p>
      </PageShell>
    );
  }

  if (!po) {
    return (
      <PageShell title="Purchase Order">
        <Alert variant="error">{error || 'Purchase order not found.'}</Alert>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={po.po_number}
      actions={
        <Link href="/procurement/purchase-orders">
          <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back to Purchase Orders</Button>
        </Link>
      }
    >
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant(po.status)}>{po.status.replace(/_/g, ' ')}</Badge>
          <span className="text-body text-neutral-500 dark:text-neutral-400">
            Vendor: {vendorName(po.vendor_id)}
            {po.expected_date && <> &middot; Expected {new Date(po.expected_date).toLocaleDateString()}</>}
          </span>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {lastBillAmount && (
          <Alert variant="success">
            Received successfully. AP bill created for {formatCurrency(lastBillAmount)}.
          </Alert>
        )}

        <Card className="overflow-hidden">
          <table className="w-full text-left text-body">
            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">Item</th>
                <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 text-right">Ordered</th>
                <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 text-right">Unit Cost</th>
                <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 text-right">Received</th>
                {isReceivable && (
                  <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 text-right w-40">Receive Now</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {po.lines.map((line) => {
                const remaining = line.quantity - line.quantity_received;
                return (
                  <tr key={line.id}>
                    <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{itemName(line.item_id)}</td>
                    <td className="px-4 py-3 text-right">{line.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(line.unit_cost)}</td>
                    <td className="px-4 py-3 text-right">{line.quantity_received} / {line.quantity}</td>
                    {isReceivable && (
                      <td className="px-4 py-3 text-right">
                        {remaining > 0 ? (
                          <Input
                            label=""
                            type="number"
                            step="any"
                            min={0}
                            max={remaining}
                            value={receiveQty[line.id] ?? ''}
                            onChange={(e) => setReceiveQty((prev) => ({ ...prev, [line.id]: e.target.value }))}
                          />
                        ) : (
                          <span className="text-neutral-400">Fully received</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {isReceivable && (
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleReceive} isLoading={receiving} leftIcon={<PackageCheck size={16} />}>
              Receive Stock
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  );
}
