'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, Card, CardContent, StatCard, Badge, Alert, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/formatCurrency';
import { ArrowLeft, Wallet, FileText } from 'lucide-react';

interface VendorPO {
  id: string;
  po_number: string;
  status: string;
  created_at: string;
  total_value: string;
}

interface VendorBill {
  id: string;
  bill_number: string;
  amount: string;
  status: string;
  due_date: string;
}

interface VendorDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  outstanding_amount: string;
  purchase_orders: VendorPO[];
  bills: VendorBill[];
}

const BASE = '/api/v1/procurement';

export default function VendorDetailPage() {
  const params = useParams<{ id: string }>();
  const vendorId = params.id;

  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!vendorId) return;
    setLoading(true);
    setError('');
    apiClient
      .get(`${BASE}/vendors/${vendorId}`)
      .then((res) => setVendor(res.data))
      .catch((err) => setError(isApiError(err) ? err.message : 'Failed to load vendor'))
      .finally(() => setLoading(false));
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <PageShell title="Vendor">
        <p className="text-body text-neutral-500">Loading...</p>
      </PageShell>
    );
  }

  if (!vendor) {
    return (
      <PageShell title="Vendor">
        <Alert variant="error">{error || 'Vendor not found.'}</Alert>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={vendor.name}
      actions={
        <Link href="/finance/accounts-payable">
          <Button variant="outline" leftIcon={<ArrowLeft size={16} />}>Back to Accounts Payable</Button>
        </Link>
      }
    >
      <div className="space-y-6 max-w-4xl">
        <p className="text-body text-neutral-500 dark:text-neutral-400">
          {vendor.email || 'No email on file'}{vendor.phone && <> &middot; {vendor.phone}</>}
        </p>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Outstanding (AP)"
            value={formatCurrency(vendor.outstanding_amount)}
            icon={<Wallet size={18} />}
          />
          <StatCard
            label="Purchase Orders"
            value={String(vendor.purchase_orders.length)}
            icon={<FileText size={18} />}
          />
        </div>

        <Card>
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">AP Bills</h2>
          </div>
          <CardContent className="p-0">
            {vendor.bills.length === 0 ? (
              <p className="p-6 text-body text-neutral-500">No bills recorded for this vendor yet.</p>
            ) : (
              <table className="w-full text-left text-body">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">Bill No</th>
                    <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">Status</th>
                    <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {vendor.bills.map((bill) => (
                    <tr key={bill.id}>
                      <td className="px-4 py-3 font-mono text-neutral-900 dark:text-neutral-100">{bill.bill_number}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(bill.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={bill.status === 'PAID' ? 'success' : 'neutral'}>{bill.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{new Date(bill.due_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <h2 className="text-card-title text-neutral-900 dark:text-neutral-100">Purchase Order History</h2>
          </div>
          <CardContent className="p-0">
            {vendor.purchase_orders.length === 0 ? (
              <p className="p-6 text-body text-neutral-500">No purchase orders for this vendor yet.</p>
            ) : (
              <table className="w-full text-left text-body">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">PO Number</th>
                    <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 text-right">Total Value</th>
                    <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">Status</th>
                    <th className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                  {vendor.purchase_orders.map((po) => (
                    <tr key={po.id}>
                      <td className="px-4 py-3">
                        <Link href={`/procurement/purchase-orders/${po.id}`} className="font-mono text-accent-600 hover:text-accent-700 dark:text-accent-400 hover:underline">
                          {po.po_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(po.total_value)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={po.status === 'received' ? 'success' : po.status === 'partially_received' ? 'warning' : 'neutral'}>
                          {po.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">{new Date(po.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
