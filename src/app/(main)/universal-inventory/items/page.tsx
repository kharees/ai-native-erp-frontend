'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  item_code: string;
  sku: string;
  name: string;
  status: string;
  category_id: string | null;
  attributes: Record<string, string>;
}

type AliasType = 'OEM' | 'AFTERMARKET' | 'COMPETITOR' | 'BARCODE';

interface ItemAlias {
  id: string;
  item_id: string;
  alias_code: string;
  alias_type: AliasType;
  source: string | null;
}

const ITEMS_BASE = '/api/v1/universal-inventory/items';
const CATEGORIES_BASE = '/api/v1/universal-inventory/categories';
const ALIAS_TYPES: AliasType[] = ['OEM', 'AFTERMARKET', 'COMPETITOR', 'BARCODE'];

export default function ItemMasterPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [itemCode, setItemCode] = useState('');
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('draft');
  const [categoryId, setCategoryId] = useState('');
  const [attrs, setAttrs] = useState<{ key: string; value: string }[]>([]);
  const [attrKey, setAttrKey] = useState('');
  const [attrValue, setAttrValue] = useState('');

  const [aliases, setAliases] = useState<ItemAlias[]>([]);
  const [aliasesLoading, setAliasesLoading] = useState(false);
  const [aliasCode, setAliasCode] = useState('');
  const [aliasType, setAliasType] = useState<AliasType>('OEM');
  const [aliasSource, setAliasSource] = useState('');
  const [aliasSaving, setAliasSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(ITEMS_BASE),
      apiClient.get(CATEGORIES_BASE),
    ])
      .then(([itemsRes, catsRes]) => {
        setItems(itemsRes.data.items || []);
        setCategories(catsRes.data.items || []);
      })
      .catch(() => setError('Failed to load items'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setItemCode('');
    setSku('');
    setName('');
    setStatus('draft');
    setCategoryId('');
    setAttrs([]);
    setAttrKey('');
    setAttrValue('');
    setAliases([]);
    setAliasCode('');
    setAliasType('OEM');
    setAliasSource('');
  };

  const loadAliases = (itemId: string) => {
    setAliasesLoading(true);
    apiClient
      .get(`${ITEMS_BASE}/${itemId}/aliases`)
      .then((res) => setAliases(res.data || []))
      .catch(() => setError('Failed to load alternate part numbers'))
      .finally(() => setAliasesLoading(false));
  };

  const handleEdit = (item: Item) => {
    setEditingId(item.id);
    setItemCode(item.item_code);
    setSku(item.sku);
    setName(item.name);
    setStatus(item.status);
    setCategoryId(item.category_id || '');
    setAttrs(Object.entries(item.attributes || {}).map(([key, value]) => ({ key, value: String(value) })));
    setShowForm(true);
    loadAliases(item.id);
  };

  const handleAddAlias = async () => {
    if (!editingId || !aliasCode.trim()) return;
    setAliasSaving(true);
    setError('');
    try {
      await apiClient.post(`${ITEMS_BASE}/${editingId}/aliases`, {
        alias_code: aliasCode.trim(),
        alias_type: aliasType,
        source: aliasSource.trim() || null,
      });
      setAliasCode('');
      setAliasSource('');
      loadAliases(editingId);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to add alternate part number');
    } finally {
      setAliasSaving(false);
    }
  };

  const handleDeleteAlias = async (aliasId: string) => {
    if (!editingId) return;
    try {
      await apiClient.delete(`${ITEMS_BASE}/${editingId}/aliases/${aliasId}`);
      loadAliases(editingId);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to remove alternate part number');
    }
  };

  const addAttribute = () => {
    if (!attrKey.trim()) return;
    setAttrs((prev) => [...prev, { key: attrKey.trim(), value: attrValue.trim() }]);
    setAttrKey('');
    setAttrValue('');
  };

  const removeAttribute = (key: string) => {
    setAttrs((prev) => prev.filter((a) => a.key !== key));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const attributes = Object.fromEntries(attrs.map((a) => [a.key, a.value]));
    const payload = {
      item_code: itemCode,
      sku,
      name,
      status,
      category_id: categoryId || null,
      attributes,
    };
    try {
      if (editingId) {
        await apiClient.patch(`${ITEMS_BASE}/${editingId}`, payload);
      } else {
        await apiClient.post(ITEMS_BASE, payload);
      }
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await apiClient.delete(`${ITEMS_BASE}/${deleteId}`);
        load();
      } catch (err) {
        setError(isApiError(err) ? err.message : 'Failed to delete item');
      } finally {
        setDeleteId(null);
      }
    }
  };

  const columns: Column<Item>[] = [
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.sku}</span>
    },
    {
      key: 'name',
      header: 'Item Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'active' || row.status === 'ACTIVE' ? 'success' : row.status === 'draft' ? 'neutral' : 'warning'}>
          {row.status}
        </Badge>
      )
    },
    {
      key: 'attributes',
      header: 'Attributes',
      cell: (row) => <span className="text-neutral-500">{Object.keys(row.attributes || {}).length} field(s)</span>
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
    },
  ];

  return (
    <PageShell 
      title="Universal Item Master" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'Create Item'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage all universal products, variants, and dynamic attributes.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <FormSection title={editingId ? 'Edit Universal Item' : 'Create New Universal Item'}>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <FormRow>
                      <Input label="Item Code" required value={itemCode} onChange={(e) => setItemCode(e.target.value)} />
                      <Input label="SKU" required value={sku} onChange={(e) => setSku(e.target.value)} />
                    </FormRow>
                    <FormRow>
                      <Input label="Item Name" required value={name} onChange={(e) => setName(e.target.value)} />
                      <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">- None -</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </Select>
                    </FormRow>
                    <FormRow>
                      <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Select>
                    </FormRow>

                    <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Dynamic Attributes</h3>
                      <p className="text-caption text-neutral-500 mb-4">Add custom metadata fields without schema changes.</p>

                      {attrs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {attrs.map((a) => (
                            <Badge key={a.key} variant="neutral" className="flex items-center gap-1 text-sm py-1.5 px-3">
                              <span className="font-semibold">{a.key}:</span> {a.value}
                              <button type="button" onClick={() => removeAttribute(a.key)} className="ml-1 text-neutral-400 hover:text-danger-dark dark:hover:text-red-500">
                                <X size={14} />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 items-end bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <Input label="Attribute Key" placeholder="e.g. Voltage, GSM, Material" value={attrKey} onChange={(e) => setAttrKey(e.target.value)} />
                        <Input label="Value" placeholder="e.g. 220V, 400g, Steel" value={attrValue} onChange={(e) => setAttrValue(e.target.value)} />
                        <Button type="button" variant="secondary" onClick={addAttribute} disabled={!attrKey.trim()}>Add</Button>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                      <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                      <Button variant="primary" type="submit" isLoading={saving}>
                        {editingId ? 'Update Item' : 'Save Item'}
                      </Button>
                    </div>
                  </form>
                </FormSection>
              </CardContent>
            </Card>

            {editingId && (
              <Card>
                <CardContent className="p-6">
                  <FormSection title="Alternate Part Numbers">
                    <p className="text-caption text-neutral-500 mb-4">
                      OEM, aftermarket, and competitor cross-reference codes (and scanned barcodes) that
                      should resolve to this same item -- used by manual search and the photo-capture pipeline.
                    </p>

                    {aliasesLoading ? (
                      <p className="text-sm text-neutral-500 mb-4">Loading aliases...</p>
                    ) : aliases.length > 0 ? (
                      <div className="space-y-2 mb-6">
                        {aliases.map((a) => (
                          <div key={a.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800 text-sm">
                            <div className="flex items-center gap-3">
                              <Badge variant="accent">{a.alias_type}</Badge>
                              <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">{a.alias_code}</span>
                              {a.source && <span className="text-neutral-500">— {a.source}</span>}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteAlias(a.id)} className="text-danger-dark dark:text-red-500">Remove</Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 mb-6 italic">No alternate part numbers yet.</p>
                    )}

                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <Input label="Part Number" placeholder="e.g. 0 986 494 104" value={aliasCode} onChange={(e) => setAliasCode(e.target.value)} />
                        <Select label="Type" value={aliasType} onChange={(e) => setAliasType(e.target.value as AliasType)}>
                          {ALIAS_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </Select>
                        <Input label="Source (Optional)" placeholder="e.g. Bosch, Denso" value={aliasSource} onChange={(e) => setAliasSource(e.target.value)} />
                      </div>
                      <div className="flex justify-end">
                        <Button type="button" variant="secondary" onClick={handleAddAlias} disabled={aliasSaving || !aliasCode.trim()} isLoading={aliasSaving}>
                          Add Alternate Part
                        </Button>
                      </div>
                    </div>
                  </FormSection>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={items} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search items..."
          />
        </div>

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="Delete Item"
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          destructive={true}
        />
      </div>
    </PageShell>
  );
}
