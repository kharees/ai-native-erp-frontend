'use client';
import React, { useState } from 'react';
import { PageShell, Card, CardContent, Button, Badge } from '@/components/ui';
import { Upload, FileText, ShieldAlert, Sparkles, CheckCircle, Search, Settings, AlertTriangle } from 'lucide-react';

export default function MigrationHubPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'mapping' | 'cleansing' | 'validation' | 'preview'>('upload');

  return (
    <PageShell 
      title="Enterprise Data Migration Hub" 
      actions={
        <Badge variant="accent" className="flex items-center gap-2 px-3 py-1.5 text-sm">
          <Sparkles className="w-4 h-4" /> AI Advisory Active
        </Badge>
      }
    >
      <div className="space-y-6">
        <p className="text-body text-neutral-500 dark:text-neutral-400">AI-Powered Master Data Importer with automated cleansing and validation.</p>

        <div className="flex gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4 overflow-x-auto">
          {[
            { id: 'upload', icon: Upload, label: '1. File Upload' },
            { id: 'mapping', icon: Settings, label: '2. AI Mapping' },
            { id: 'cleansing', icon: Search, label: '3. Cleansing Dashboard' },
            { id: 'validation', icon: ShieldAlert, label: '4. Validation Dashboard' },
            { id: 'preview', icon: CheckCircle, label: '5. Preview & Import' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'upload' | 'mapping' | 'cleansing' | 'validation' | 'preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-accent-600 text-white shadow-md'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <Card className="min-h-[500px]">
          <CardContent className="p-8 h-full">
            
            {activeTab === 'upload' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-6 text-center animate-in fade-in">
                <div className="w-24 h-24 bg-accent-50 dark:bg-accent-950/30 rounded-full flex items-center justify-center">
                  <FileText className="w-12 h-12 text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Drag & Drop Master Data</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">Supports Excel (.xlsx), CSV, JSON, and XML exported from Tally, SAP, Zoho, and more.</p>
                </div>
                <input type="file" className="block w-full max-w-sm text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100 dark:file:bg-accent-950/30 dark:file:text-accent-400 cursor-pointer" />
              </div>
            )}

            {activeTab === 'mapping' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100"><Sparkles className="text-warning-500"/> AI Field Mapping Suggestions</h2>
                  <Badge variant="success">Overall Confidence: 87%</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 font-semibold text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <div>Source Column (Excel)</div>
                  <div>Suggested Target Field</div>
                  <div>Confidence Score</div>
                </div>
                {[
                  { source: 'Customer Name', target: 'name', score: 95 },
                  { source: 'Email Address', target: 'email', score: 95 },
                  { source: 'Phone No', target: 'phone', score: 82 },
                  { source: 'Random Field', target: 'Unmapped', score: 0 },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-3 gap-4 items-center py-4 border-b border-neutral-100 dark:border-neutral-800/50">
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">{row.source}</div>
                    <div>
                      <select className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded p-2 w-full max-w-[200px] text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-accent-500">
                        <option value={row.target}>{row.target}</option>
                      </select>
                    </div>
                    <div>
                      {row.score > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5 max-w-[150px]">
                            <div className={`h-2.5 rounded-full ${row.score > 80 ? 'bg-success-500' : 'bg-warning-500'}`} style={{ width: `${row.score}%` }}></div>
                          </div>
                          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{row.score}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-400">Needs manual mapping</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'cleansing' && (
              <div className="space-y-6 animate-in fade-in">
                 <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100"><Search className="text-indigo-500"/> Data Cleansing Dashboard</h2>
                  <Badge variant="accent">1 Duplicate Cluster Detected</Badge>
                </div>
                <div className="bg-warning-50 dark:bg-warning-950/20 border border-warning-200 dark:border-warning-900/50 p-6 rounded-xl">
                  <h3 className="font-semibold text-warning-800 dark:text-warning-500 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5"/> Potential Duplicate Customers
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-lg border border-warning-100 dark:border-warning-900/30 shadow-sm">
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">Acme Corp</div>
                        <div className="text-sm text-neutral-500">info@acme.com | 1234567890</div>
                      </div>
                      <Button variant="ghost" className="text-accent-600 dark:text-accent-400">Select as Primary</Button>
                    </div>
                    <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-lg border border-warning-100 dark:border-warning-900/30 shadow-sm">
                      <div>
                        <div className="font-bold text-neutral-900 dark:text-neutral-100">Acme Corporation</div>
                        <div className="text-sm text-neutral-500">info@acme.com | 1234567890</div>
                      </div>
                      <Button variant="ghost" className="text-accent-600 dark:text-accent-400">Select as Primary</Button>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button variant="primary">Merge & Keep Primary</Button>
                    <Button variant="secondary">Keep Both</Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'validation' && (
               <div className="space-y-6 animate-in fade-in">
               <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100"><ShieldAlert className="text-danger-500"/> Validation Rules Engine</h2>
                <Badge variant="danger">3 Errors Found</Badge>
              </div>
              <div className="grid gap-4">
                <div className="p-4 border border-danger-200 bg-danger-50 dark:bg-danger-950/20 dark:border-danger-900/50 rounded-lg flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-danger-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-danger-800 dark:text-red-400">Row 42: Invalid email format in field &apos;email&apos;</h4>
                    <p className="text-sm text-danger-600 dark:text-red-300 mt-1">Value provided: &quot;invalid_email.com&quot;</p>
                    <div className="mt-4 bg-white dark:bg-neutral-900 p-3 rounded-md border border-danger-100 dark:border-danger-900/30 text-sm text-neutral-600 dark:text-neutral-300 shadow-sm">
                      <span className="font-bold text-accent-600 dark:text-accent-400">AI Assistant:</span> The email format is incorrect. Ensure it contains an &apos;@&apos; symbol and a valid domain.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {activeTab === 'preview' && (
               <div className="space-y-6 animate-in fade-in h-full flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-neutral-900 dark:text-neutral-100"><CheckCircle className="text-success-500"/> Migration Readiness Preview</h2>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-neutral-500">Data Quality Score</div>
                      <div className="text-2xl font-bold text-success-600 dark:text-green-500">98%</div>
                    </div>
                    <Button variant="primary" className="bg-success-600 hover:bg-success-700 dark:bg-green-600 dark:hover:bg-green-700 text-white border-0 shadow-lg px-6 h-12 text-base">
                      Start Import
                    </Button>
                  </div>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <th className="p-4 font-semibold text-sm text-neutral-500">Status</th>
                        <th className="p-4 font-semibold text-sm text-neutral-500">Name</th>
                        <th className="p-4 font-semibold text-sm text-neutral-500">Email</th>
                        <th className="p-4 font-semibold text-sm text-neutral-500">Phone</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {[1, 2, 3].map((row) => (
                        <tr key={row} className="hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50">
                          <td className="p-4"><span className="w-3 h-3 rounded-full bg-success-500 inline-block shadow-sm"></span></td>
                          <td className="p-4 font-medium text-neutral-900 dark:text-neutral-100">Acme Corp</td>
                          <td className="p-4 text-neutral-500">info@acme.com</td>
                          <td className="p-4 text-neutral-500">1234567890</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
