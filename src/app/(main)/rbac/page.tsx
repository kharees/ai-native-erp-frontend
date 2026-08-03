'use client';

import React, { useState, useEffect } from 'react';
import { fetchRoles, fetchPermissions, updateRolePermissions, createRole } from '@/services/rbacService';
import type { Role, Permission } from '@/types/rbac';
import { PageShell, Card, CardContent, Button, Input, Select, Badge } from '@/components/ui';
import { Shield, Save, Plus } from 'lucide-react';

export default function RBACPage() {
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [editingRole, setEditingRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([fetchRoles(), fetchPermissions()]);
      setRoles(r);
      setPermissions(p);
      if (r.length > 0) setEditingRole(r[0].id);
    } catch (e) {
      console.error('Failed to load RBAC data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const newRole = await createRole({ name: newRoleName, description: 'Custom Role' });
      setRoles(prev => [...prev, newRole]);
      setNewRoleName('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePermission = (permissionId: string) => {
    if (!editingRole) return;
    setMatrix(prev => {
      const roleMatrix = { ...(prev[editingRole] || {}) };
      roleMatrix[permissionId] = !roleMatrix[permissionId];
      return { ...prev, [editingRole]: roleMatrix };
    });
  };

  const handleSaveMatrix = async () => {
    if (!editingRole) return;
    setSaving(true);
    
    const roleMatrix = matrix[editingRole] || {};
    const selectedIds = Object.keys(roleMatrix).filter(id => roleMatrix[id]);
    
    try {
      await updateRolePermissions([{ role_id: editingRole, permission_ids: selectedIds }]);
      alert('Matrix saved successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to save matrix');
    } finally {
      setSaving(false);
    }
  };

  const modules = Array.from(new Set(permissions.map(p => p.module)));
  const actions = Array.from(new Set(permissions.map(p => p.action)));

  const getPermission = (mod: string, act: string) => permissions.find(p => p.module === mod && p.action === act);

  return (
    <PageShell 
      title="Access Control" 
      actions={
        <div className="flex gap-2">
          <Input 
            placeholder="New custom role..." 
            value={newRoleName}
            onChange={e => setNewRoleName(e.target.value)}
          />
          <Button variant="secondary" onClick={handleCreateRole} leftIcon={<Plus size={16} />} disabled={!newRoleName.trim()}>
            Create Role
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage enterprise roles, permission matrices, and user assignments.</p>

        <div className="border-b border-neutral-200 dark:border-neutral-800">
          <nav className="-mb-px flex space-x-8">
            {['roles', 'matrix', 'assignments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-accent-600 text-accent-700 dark:border-accent-500 dark:text-accent-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
                }`}
              >
                {tab === 'roles' ? 'Role Definitions' : tab === 'matrix' ? 'Permission Matrix' : 'User Assignments'}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? <p className="text-sm text-neutral-500">Loading roles...</p> : roles.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow group relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{role.name}</h3>
                    <Badge variant={role.is_system ? 'accent' : 'neutral'}>
                      {role.is_system ? 'System' : 'Custom'}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                    {role.description || 'No description provided.'}
                  </p>
                  <p className="text-xs text-neutral-400">Level {role.hierarchy_level}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'matrix' && (
          <Card>
             <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Editing Role:</span>
                  <Select 
                    value={editingRole}
                    onChange={e => setEditingRole(e.target.value)}
                  >
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </Select>
                </div>
                <Button variant="primary" onClick={handleSaveMatrix} isLoading={saving} leftIcon={<Save size={16} />}>
                  Save Matrix
                </Button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr>
                     <th className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900/30 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 border-r">Module</th>
                     {actions.map(action => (
                       <th key={action} className="px-4 py-4 bg-neutral-50 dark:bg-neutral-900/30 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 text-center text-[10px]">
                         {action}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                   {loading ? (
                     <tr><td colSpan={actions.length + 1} className="p-4 text-center text-sm text-neutral-500">Loading matrix...</td></tr>
                   ) : modules.map(module => (
                     <tr key={module} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap font-medium text-sm text-neutral-900 dark:text-neutral-200 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/50">
                         {module}
                       </td>
                       {actions.map(action => {
                         const p = getPermission(module, action);
                         const isChecked = p ? !!(matrix[editingRole]?.[p.id]) : false;
                         
                         return (
                           <td key={action} className="px-4 py-4 text-center">
                             {p ? (
                               <input 
                                 type="checkbox" 
                                 checked={isChecked}
                                 onChange={() => handleTogglePermission(p.id)}
                                 className="w-4 h-4 text-accent-600 bg-neutral-100 border-neutral-300 rounded focus:ring-accent-500 cursor-pointer" 
                               />
                             ) : <span className="text-neutral-300 dark:text-neutral-700">-</span>}
                           </td>
                         )
                       })}
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </Card>
        )}

        {activeTab === 'assignments' && (
          <Card className="text-center flex flex-col items-center justify-center p-12">
             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-50 dark:bg-accent-900/20 mb-4">
               <Shield className="w-8 h-8 text-accent-600 dark:text-accent-400" />
             </div>
             <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">Role Assignments</h3>
             <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-md mx-auto">
               Assign roles to users globally or scope them to specific branches and warehouses. This is managed via the Users directory.
             </p>
             <Button variant="primary" onClick={() => window.location.href = '/users'}>
               Go to User Directory
             </Button>
          </Card>
        )}

      </div>
    </PageShell>
  );
}
