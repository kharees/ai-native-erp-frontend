'use client';

import { useState } from 'react';
import { useCrudResource } from '@/hooks/useCrudResource';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, Input, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
}

const BASE = '/api/v1/universal-inventory/categories';

export default function CategoriesPage() {
  const { data: categories, loading, error, saving, create, update, remove } = useCrudResource<Category>(BASE);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, description: description || null };
    const ok = editingId ? await update(editingId, payload) : await create(payload);
    if (ok) resetForm();
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await remove(deleteId);
      setDeleteId(null);
    }
  };

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</span>
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{row.description || '-'}</span>
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
      title="Category Management" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Create Category'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage product hierarchy and classifications.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title={editingId ? 'Edit Category' : 'Create New Category'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Category Name" required value={name} onChange={(e) => setName(e.target.value)} />
                  <div>
                    <label className="block text-caption font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-md border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-accent-500 focus:ring-accent-500 sm:text-sm p-2 border"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>
                      {editingId ? 'Update Category' : 'Save Category'}
                    </Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={categories} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search categories..."
          />
        </div>

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Delete Category"
          description="Are you sure you want to delete this category? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          destructive={true}
        />
      </div>
    </PageShell>
  );
}
