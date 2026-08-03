'use client';

import { useState } from 'react';
import { useCrudResource } from '@/hooks/useCrudResource';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface UOM {
  id: string;
  name: string;
  abbreviation: string;
  conversion_factor: number;
  is_active: boolean;
}

const BASE = '/api/v1/universal-inventory/uoms';

export default function UOMPage() {
  const { data: uoms, loading, error, saving, create, update, remove } = useCrudResource<UOM>(BASE);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [conversionFactor, setConversionFactor] = useState('1');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName('');
    setAbbreviation('');
    setConversionFactor('1');
  };

  const handleEdit = (uom: UOM) => {
    setEditingId(uom.id);
    setName(uom.name);
    setAbbreviation(uom.abbreviation);
    setConversionFactor(String(uom.conversion_factor));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, abbreviation, conversion_factor: parseFloat(conversionFactor) || 1 };
    const ok = editingId ? await update(editingId, payload) : await create(payload);
    if (ok) resetForm();
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await remove(deleteId);
      setDeleteId(null);
    }
  };

  const columns: Column<UOM>[] = [
    {
      key: 'name',
      header: 'UOM Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</span>
    },
    {
      key: 'abbreviation',
      header: 'Abbreviation',
      sortable: true,
      cell: (row) => <span className="text-neutral-500 font-mono">{row.abbreviation}</span>
    },
    {
      key: 'conversion_factor',
      header: 'Conversion Factor',
      sortable: true,
      cell: (row) => <span className="text-neutral-900 dark:text-neutral-100">{row.conversion_factor}</span>
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
      title="Unit of Measure (UOM) Engine" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Create UOM'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage base units and define conversion factors.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title={editingId ? 'Edit UOM' : 'Create New UOM'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Input label="UOM Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <Input label="Abbreviation" required value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} />
                    <Input type="number" step="0.0001" label="Conversion Factor" required value={conversionFactor} onChange={(e) => setConversionFactor(e.target.value)} />
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving}>
                      {editingId ? 'Update UOM' : 'Save UOM'}
                    </Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={uoms} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search units of measure..."
          />
        </div>

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Delete UOM"
          description="Are you sure you want to delete this UOM? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          destructive={true}
        />
      </div>
    </PageShell>
  );
}
