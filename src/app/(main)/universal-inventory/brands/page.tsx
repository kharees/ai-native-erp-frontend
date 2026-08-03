'use client';

import { useState } from 'react';
import { useCrudResource } from '@/hooks/useCrudResource';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Brand {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  is_active: boolean;
}

const BASE = '/api/v1/universal-inventory/brands';

export default function BrandsPage() {
  const { data: brands, loading, error, saving, create, update, remove } = useCrudResource<Brand>(BASE);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setWebsite('');
  };

  const handleEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setName(brand.name);
    setWebsite(brand.website || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, website: website || null };
    const ok = editingId ? await update(editingId, payload) : await create(payload);
    if (ok) resetForm();
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await remove(deleteId);
      setDeleteId(null);
    }
  };

  const columns: Column<Brand>[] = [
    {
      key: 'name',
      header: 'Brand Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</span>
    },
    {
      key: 'website',
      header: 'Website',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{row.website || '-'}</span>
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} leftIcon={<Edit2 size={14} />}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.id)} className="text-danger-dark dark:text-red-500" leftIcon={<Trash2 size={14} />}>
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageShell 
      title="Brand Management" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Create Brand'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage product manufacturers and brand records.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title={editingId ? 'Edit Brand' : 'Create New Brand'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Input label="Brand Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <Input label="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>
                      {editingId ? 'Update Brand' : 'Save Brand'}
                    </Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={brands} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search brands..."
          />
        </div>

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Delete Brand"
          description="Are you sure you want to delete this brand? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          destructive={true}
        />
      </div>
    </PageShell>
  );
}
