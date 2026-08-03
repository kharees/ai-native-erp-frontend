'use client';

import React from 'react';
import { PageShell, Card, CardContent, FormSection, FormRow, Input, Select, Button } from '@/components/ui';

export default function OrganizationPage() {
  return (
    <PageShell 
      title="Organization Settings" 
      actions={
        <div className="flex gap-2">
          <Button variant="outline">Discard Changes</Button>
          <Button variant="primary">Save Settings</Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">Manage your company profile, branches, departments, and global business preferences.</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <nav className="flex flex-col space-y-1" aria-label="Settings sections">
              {['Company Profile', 'Business Settings', 'Branches', 'Departments', 'Warehouses'].map((item, i) => (
                <button
                  key={item}
                  type="button"
                  className={
                    i === 0
                      ? 'flex items-center px-4 py-3 text-sm font-medium rounded-lg bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-400 transition-colors'
                      : 'flex items-center px-4 py-3 text-sm font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors'
                  }
                >
                  {item}
                </button>
              ))}
            </nav>
          </aside>

          <main className="lg:col-span-3 space-y-6">
            <Card>
              <CardContent className="p-6">
                <FormSection title="Company Profile">
                  <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-6">Basic information about your organization.</p>
                  <div className="space-y-6">
                    <FormRow>
                      <Input label="Company Name" placeholder="Enter company name" />
                      <Input label="Registration Number" placeholder="Business ID or Tax ID" />
                    </FormRow>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-label text-neutral-700 dark:text-neutral-300 font-medium">Headquarters Address</label>
                      <textarea
                        placeholder="Primary business address..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-md shadow-sm outline-none focus:ring-1 focus:ring-accent-500 focus:border-accent-500 transition-all text-body text-neutral-900 dark:text-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </FormSection>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <FormSection title="Business Settings">
                  <p className="text-caption text-neutral-500 dark:text-neutral-400 mb-6">Localization and fiscal configuration.</p>
                  <div className="space-y-6">
                    <FormRow>
                      <Select label="Default Currency">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </Select>
                      <Select label="Timezone">
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="EST">EST (Eastern Standard Time)</option>
                        <option value="PST">PST (Pacific Standard Time)</option>
                        <option value="IST">IST (Indian Standard Time)</option>
                      </Select>
                    </FormRow>
                    <FormRow>
                      <Select label="Fiscal Year Start Month">
                        <option value="1">January</option>
                        <option value="4">April</option>
                        <option value="7">July</option>
                        <option value="10">October</option>
                      </Select>
                    </FormRow>
                  </div>
                </FormSection>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </PageShell>
  );
}
