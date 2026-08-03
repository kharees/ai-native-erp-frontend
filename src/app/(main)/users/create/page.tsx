'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { provisionUser } from '@/services/userService';
import { fetchRoles } from '@/services/rbacService';
import type { Role } from '@/types/rbac';
import { PageShell, Card, CardContent, FormSection, FormRow, Input, Button, Alert } from '@/components/ui';
import { UserPlus } from 'lucide-react';

export default function ProvisionUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    employee_code: '',
    designation: '',
    selectedRoles: [] as string[]
  });

  useEffect(() => {
    fetchRoles().then(data => setRoles(data)).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedRoles.includes(roleId);
      return {
        ...prev,
        selectedRoles: isSelected 
          ? prev.selectedRoles.filter(id => id !== roleId)
          : [...prev.selectedRoles, roleId]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await provisionUser({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        employee_code: formData.employee_code,
        designation: formData.designation,
        roles: formData.selectedRoles
      });
      router.push('/users');
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to provision user');
      setLoading(false);
    }
  };

  return (
    <PageShell 
      title="Provision User" 
      actions={
        <Link href="/users">
          <Button variant="outline">Cancel</Button>
        </Link>
      }
    >
      <div className="space-y-6 max-w-4xl">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Create a new user account and assign enterprise roles.</p>

        {error && <Alert variant="error">{error}</Alert>}

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <FormSection title="Personal Information">
                <FormRow>
                  <Input label="First Name" required name="first_name" value={formData.first_name} onChange={handleChange} />
                  <Input label="Last Name" required name="last_name" value={formData.last_name} onChange={handleChange} />
                </FormRow>
                <FormRow>
                  <Input label="Email Address" type="email" required name="email" value={formData.email} onChange={handleChange} />
                  <Input label="Password" type="password" required name="password" value={formData.password} onChange={handleChange} />
                </FormRow>
              </FormSection>

              <FormSection title="Employment Details">
                <FormRow>
                  <Input label="Employee Code" name="employee_code" value={formData.employee_code} onChange={handleChange} />
                  <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} />
                </FormRow>
              </FormSection>

              <FormSection title="Enterprise Roles & Permissions">
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  Select the roles to assign to this user. This determines their access across the ERP.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roles.map(role => (
                    <label 
                      key={role.id}
                      className={`
                        relative flex items-start p-4 cursor-pointer rounded-xl border-2 transition-all
                        ${formData.selectedRoles.includes(role.id) 
                          ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/20' 
                          : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-accent-300 dark:hover:border-accent-700'
                        }
                      `}
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-accent-600 border-neutral-300 rounded focus:ring-accent-500 cursor-pointer"
                          checked={formData.selectedRoles.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                        />
                      </div>
                      <div className="ml-3 flex flex-col">
                        <span className={`block text-sm font-medium ${
                          formData.selectedRoles.includes(role.id) ? 'text-accent-900 dark:text-accent-100' : 'text-neutral-900 dark:text-neutral-100'
                        }`}>
                          {role.name}
                        </span>
                        <span className={`block text-xs mt-1 ${
                          formData.selectedRoles.includes(role.id) ? 'text-accent-700 dark:text-accent-400' : 'text-neutral-500 dark:text-neutral-400'
                        }`}>
                          {role.description || 'No description provided'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </FormSection>

              <div className="flex justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                <Link href="/users">
                  <Button variant="outline" type="button">Cancel</Button>
                </Link>
                <Button variant="primary" type="submit" isLoading={loading} leftIcon={<UserPlus size={16} />}>
                  Provision User
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
