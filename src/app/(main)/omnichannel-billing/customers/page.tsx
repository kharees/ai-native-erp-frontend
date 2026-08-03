'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Alert, Badge, ConfirmDialog } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatCurrency';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  credit_limit: number;
  status: string;
}

const BASE = '/api/v1/omnichannel-billing/customers';

export default function CustomersPage() {
  const tenantId = useAuthStore((s) => s.user?.tenant_id);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    apiClient
      .get(`${BASE}/`)
      .then((res) => setCustomers(res.data.items || []))
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
  };

  const handleEdit = (c: Customer) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email || '');
    setPhone(c.phone || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiClient.patch(`${BASE}/${editingId}`, { name, email: email || null, phone: phone || null });
      } else {
        await apiClient.post(`${BASE}/`, { tenant_id: tenantId, name, email: email || null, phone: phone || null });
      }
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setCustomerToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await apiClient.delete(`${BASE}/${customerToDelete}`);
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to delete customer');
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</span>
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (row) => <span className="text-neutral-500">{row.email || row.phone || '-'}</span>
    },
    {
      key: 'credit_limit',
      header: 'Credit Limit',
      sortable: true,
      align: 'right',
      cell: (row) => formatCurrency(row.credit_limit)
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} leftIcon={<Edit2 size={14} />}>Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => confirmDelete(row.id)} className="text-danger-dark dark:text-red-400" leftIcon={<Trash2 size={14} />}>Delete</Button>
        </div>
      )
    },
  ];

  return (
    <PageShell 
      title="Customer Management" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Create Customer'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage customers, groups, types, and credit limits.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title={editingId ? 'Edit Customer' : 'Create New Customer'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <Input type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving} disabled={!tenantId}>
                      {editingId ? 'Update Customer' : 'Save Customer'}
                    </Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={customers} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search customers..."
          />
        </div>
        
        <ConfirmDialog
          isOpen={isDeleteDialogOpen}
          title="Delete Customer"
          description="Are you sure you want to delete this customer? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDelete}
          onClose={() => setIsDeleteDialogOpen(false)}
          destructive={true}
        />
      </div>
    </PageShell>
  );
}
