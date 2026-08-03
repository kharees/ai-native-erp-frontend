'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { PageShell, DataTable, Alert, Badge } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { formatCurrency } from '@/lib/formatCurrency';

interface Customer {
  id: string;
  name: string;
}

interface CollectionStatus {
  customer_id: string;
  customer_name: string;
  credit_limit: number;
  total_outstanding: number;
  overdue_amount: number;
  isOnCreditHold: boolean;
}

export default function CollectionsPage() {
  const [statuses, setStatuses] = useState<CollectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/api/v1/omnichannel-billing/customers/')
      .then(async (custRes) => {
        const customers: Customer[] = custRes.data.items || [];
        const results = await Promise.all(
          customers.map((c) =>
            apiClient
              .get<CollectionStatus>(`/api/v1/omnichannel-billing/collections/status/${c.id}`)
              .then((r) => r.data)
              .catch(() => null)
          )
        );
        setStatuses(results.filter((r): r is CollectionStatus => r !== null && r.overdue_amount > 0));
      })
      .catch(() => setError('Failed to load collections'))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<CollectionStatus>[] = [
    {
      key: 'customer_name',
      header: 'Customer',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900 dark:text-neutral-100">{row.customer_name}</span>
    },
    {
      key: 'credit_limit',
      header: 'Credit Limit',
      sortable: true,
      align: 'right',
      cell: (row) => <span className="text-neutral-500">{formatCurrency(row.credit_limit)}</span>
    },
    {
      key: 'total_outstanding',
      header: 'Total Due',
      sortable: true,
      align: 'right',
      cell: (row) => formatCurrency(row.total_outstanding)
    },
    {
      key: 'overdue_amount',
      header: 'Overdue',
      sortable: true,
      align: 'right',
      cell: (row) => <span className="text-danger-dark dark:text-red-400 font-medium">{formatCurrency(row.overdue_amount)}</span>
    },
    {
      key: 'isOnCreditHold',
      header: 'Credit Hold Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.isOnCreditHold ? 'danger' : 'success'}>
          {row.isOnCreditHold ? 'On Hold' : 'Clear'}
        </Badge>
      )
    },
  ];

  return (
    <PageShell title="Collections Console">
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Customers with overdue balances requiring follow-up.</p>
        
        {error && <Alert variant="error">{error}</Alert>}

        <div className="h-[600px]">
          <DataTable 
            data={statuses} 
            columns={columns} 
            keyExtractor={(row) => row.customer_id} 
            isLoading={loading}
            searchPlaceholder="Search collections..."
          />
        </div>
      </div>
    </PageShell>
  );
}
