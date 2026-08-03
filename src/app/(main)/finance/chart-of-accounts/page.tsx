'use client';

import { useEffect, useState, useCallback } from 'react';
import apiClient, { isApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { PageShell, DataTable, Button, Card, CardContent, FormSection, FormRow, Input, Select, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus } from 'lucide-react';

interface AccountGroup {
  id: string;
  name: string;
  category: string;
}

interface Account {
  id: string;
  group_id: string;
  account_code: string;
  name: string;
  status: string;
  currency: string;
}

const GROUPS_BASE = '/api/v1/finance-core/account-groups';
const ACCOUNTS_BASE = '/api/v1/finance-core/accounts';

export default function ChartOfAccountsPage() {
  const tenantId = useAuthStore((s) => s.user?.tenant_id);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [groups, setGroups] = useState<AccountGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [accountCode, setAccountCode] = useState('');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(ACCOUNTS_BASE),
      apiClient.get(GROUPS_BASE),
    ])
      .then(([accRes, groupRes]) => {
        setAccounts(accRes.data || []);
        setGroups(groupRes.data || []);
      })
      .catch(() => setError('Failed to load chart of accounts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groupById = (id: string) => groups.find((g) => g.id === id);

  const resetForm = () => {
    setShowForm(false);
    setAccountCode('');
    setName('');
    setGroupId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError('');
    try {
      await apiClient.post(ACCOUNTS_BASE, {
        tenant_id: tenantId,
        group_id: groupId,
        account_code: accountCode,
        name,
      });
      resetForm();
      load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Account>[] = [
    {
      key: 'account_code',
      header: 'Account Code',
      sortable: true,
      cell: (row) => <span className="font-mono text-neutral-900 dark:text-neutral-100">{row.account_code}</span>
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</span>
    },
    {
      key: 'group_id',
      header: 'Group / Category',
      sortable: true,
      cell: (row) => {
        const group = groupById(row.group_id);
        if (!group) return <span className="text-neutral-500">-</span>;
        return (
          <span className="text-neutral-600 dark:text-neutral-400">
            {group.name} <span className="text-caption">({group.category})</span>
          </span>
        );
      }
    },
    {
      key: 'currency',
      header: 'Currency',
      sortable: true,
      cell: (row) => <span className="text-neutral-500">{row.currency}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.status === 'active' || row.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      )
    },
  ];

  return (
    <PageShell 
      title="Chart of Accounts" 
      actions={
        <Button variant={showForm ? 'outline' : 'primary'} onClick={() => (showForm ? resetForm() : setShowForm(true))} leftIcon={!showForm ? <Plus size={16} /> : undefined}>
          {showForm ? 'Cancel' : 'New Account'}
        </Button>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage financial accounts and their groupings.</p>

        {error && <Alert variant="error">{error}</Alert>}

        {showForm && (
          <Card>
            <CardContent className="p-6">
              <FormSection title="New Account">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormRow>
                    <Input label="Account Code" required value={accountCode} onChange={(e) => setAccountCode(e.target.value)} />
                    <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
                    <Select label="Account Group" required value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                      <option value="">- Select -</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name} ({g.category})</option>
                      ))}
                    </Select>
                  </FormRow>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" type="button" onClick={resetForm}>Cancel</Button>
                    <Button variant="primary" type="submit" isLoading={saving} disabled={!tenantId}>Save Account</Button>
                  </div>
                </form>
              </FormSection>
            </CardContent>
          </Card>
        )}

        <div className="h-[600px]">
          <DataTable 
            data={accounts} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
            searchPlaceholder="Search accounts..."
          />
        </div>
      </div>
    </PageShell>
  );
}
