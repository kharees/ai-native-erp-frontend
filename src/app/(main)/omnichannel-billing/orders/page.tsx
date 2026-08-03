'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Customer {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

interface Order {
  id: string;
  customer_id: string;
  order_number: string;
  status: string;
  approval_status: string;
  total_amount: number;
}

const BASE = '/api/v1/omnichannel-billing/sales';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`${BASE}/orders`),
      apiClient.get('/api/v1/omnichannel-billing/customers/'),
      apiClient.get('/api/v1/universal-inventory/items'),
    ])
      .then(([orderRes, custRes, itemRes]) => {
        setOrders(orderRes.data.items || []);
        setCustomers(custRes.data.items || []);
        setItems(itemRes.data.items || []);
      })
      .catch(() => setError('Failed to load sales orders'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name || id;

  const resetForm = () => {
    setShowForm(false);
    setCustomerId('');
    setOrderNumber('');
    setItemId('');
    setQuantity('1');
    setUnitPrice('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    try {
      await apiClient.post(`${BASE}/orders`, {
        customer_id: customerId,
        order_number: orderNumber,
        total_amount: qty * price,
        items: [{ item_id: itemId, quantity: qty, unit_price: price }],
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create sales order');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    setError('');
    try {
      await apiClient.post(`${BASE}/orders/${id}/approve`);
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to approve order');
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'order_number',
      header: 'Order No',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.order_number}</span>
    },
    {
      key: 'customer_id',
      header: 'Customer',
      sortable: true,
      cell: (row) => customerName(row.customer_id)
    },
    {
      key: 'total_amount',
      header: 'Total Amount',
      sortable: true,
      align: 'right',
      cell: (row) => formatCurrency(row.total_amount)
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'CONFIRMED' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'approval_status',
      header: 'Approval',
      sortable: true,
      cell: (row) => (
        row.approval_status === 'PENDING' ? (
          <Button variant="ghost" size="sm" className="text-success-dark dark:text-green-500" onClick={() => handleApprove(row.id)} leftIcon={<CheckCircle size={14} />}>
            Approve
          </Button>
        ) : (
          <Badge variant="success">
            {row.approval_status}
          </Badge>
        )
      )
    },
  ];

  return (
    <PageShell 
      title="Sales Orders" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'New Sales Order'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage orders and approvals.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="New Sales Order (single line item)">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Select label="Customer" required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                      <option value="">- Select -</option>
                      {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </Select>
                    <Input label="Order No" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
                    <Select label="Item" required value={itemId} onChange={(e) => setItemId(e.target.value)}>
                      <option value="">- Select -</option>
                      {items.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                    </Select>
                  </FormRow>
                  <FormRow>
                    <Input type="number" step="0.01" label="Quantity" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    <Input type="number" step="0.01" label="Unit Price" required value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
                    <div className="flex items-end justify-end w-full">
                      <div className="flex gap-2">
                        <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                        <Button variant="primary" type="submit" isLoading={saving}>Save Order</Button>
                      </div>
                    </div>
                  </FormRow>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={orders} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search orders..."
          />
        </div>
      </div>
    </PageShell>
  );
}
