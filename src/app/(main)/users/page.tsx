'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchUsers, changeUserStatus } from '@/services/userService';
import type { UserProfile } from '@/types/user';
import { PageShell, DataTable, Button, Badge, Card, CardContent, Input, Select } from '@/components/ui';
import { Column } from '@/components/ui/DataTable';
import { Plus, UserCheck, UserX } from 'lucide-react';

export default function UsersDirectoryPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUsers({
        search: search || undefined,
        status_filter: statusFilter !== 'All' ? statusFilter : undefined
      });
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleStatusChange = async (id: string, currentStatus: boolean) => {
    try {
      await changeUserStatus(id, !currentStatus);
      loadUsers();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const columns: Column<UserProfile>[] = [
    {
      key: 'employee',
      header: 'Employee',
      cell: (row) => (
        <div className="flex items-center gap-4">
          {row.profile_image ? (
            <Image src={row.profile_image} alt="" width={40} height={40} className="rounded-full object-cover shadow-sm" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-accent-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
              {(row.first_name?.[0] || '')}{(row.last_name?.[0] || '')}
            </div>
          )}
          <div>
            <div className="font-medium text-neutral-900 dark:text-neutral-100">
              {row.first_name} {row.last_name}
            </div>
            <div className="text-caption text-neutral-500 dark:text-neutral-400">
              {row.employee_code || 'No Code'}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (row) => (
        <div>
          <div className="text-sm text-neutral-900 dark:text-neutral-300">{row.email}</div>
          <div className="text-caption text-neutral-500 dark:text-neutral-400">{row.phone || 'No Phone'}</div>
        </div>
      )
    },
    {
      key: 'designation',
      header: 'Designation',
      sortable: true,
      cell: (row) => <span className="text-sm text-neutral-900 dark:text-neutral-300">{row.designation || 'N/A'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Active' : 'Suspended'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-2 items-center">
          <Link href={`/users/${row.id}`} className="text-accent-600 dark:text-accent-400 hover:underline text-sm font-medium mr-2">
            Edit
          </Link>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleStatusChange(row.id, row.is_active)}
            className={row.is_active ? 'text-danger-dark dark:text-red-500' : 'text-success-dark dark:text-green-500'}
            leftIcon={row.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
          >
            {row.is_active ? 'Suspend' : 'Activate'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <PageShell 
      title="User Directory" 
      actions={
        <Link href="/users/create">
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Provision User
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage employees, assignments, and reporting hierarchies.</p>

        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, employee code, or email..."
              />
            </div>
            <div className="w-full sm:w-48">
              <Select 
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">Status: All</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="h-[600px]">
          <DataTable 
            data={users} 
            columns={columns} 
            keyExtractor={(row) => row.id} 
            isLoading={loading}
          />
        </div>
      </div>
    </PageShell>
  );
}
